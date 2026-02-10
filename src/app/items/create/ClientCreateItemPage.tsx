 /* eslint-disable react-hooks/incompatible-library */
'use client'

import { useEffect, useMemo, useState } from 'react'
 import { useSearchParams, useRouter } from 'next/navigation'
 import { z } from 'zod'
 import { useForm } from 'react-hook-form'
 import { zodResolver } from '@hookform/resolvers/zod'
 import { motion } from 'framer-motion'
 import { createClient } from '@/lib/supabase/client'
 import { Button } from '@/components/ui/button'
 import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Image as ImageIcon, CalendarDays, Tag } from 'lucide-react'
import dynamic from 'next/dynamic'
import { createItem } from './actions'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-lg bg-card animate-pulse grid place-items-center text-muted-foreground">
      Loading Map...
    </div>
  ),
})
 
 const itemSchema = z.object({
   title: z.string().min(3, 'Title must be at least 3 characters'),
   description: z.string().min(10, 'Description must be at least 10 characters'),
   type: z.enum(['lost', 'found']),
   category: z.string().min(2, 'Category is required'),
   date_lost_found: z.string().optional(),
   location_name: z.string().optional(),
   latitude: z.string().optional(),
   longitude: z.string().optional(),
   images: z.any().optional(),
 })
 
 type ItemFormValues = z.infer<typeof itemSchema>
 
 const CATEGORIES = [
   'electronics',
   'jewelry',
   'documents',
   'pets',
   'clothing',
   'accessories',
   'bags',
   'keys',
   'vehicles',
 ]
 
 export default function ClientCreateItemPage() {
   const searchParams = useSearchParams()
   const router = useRouter()
   const supabase = useMemo(() => createClient(), [])
 
   const initialType = (searchParams.get('type') === 'found' ? 'found' : 'lost') as 'lost' | 'found'
 
   const {
     register,
     handleSubmit,
     watch,
     setValue,
     formState: { errors, isSubmitting },
   } = useForm<ItemFormValues>({
     resolver: zodResolver(itemSchema),
     defaultValues: {
       type: initialType,
     },
   })
 
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null)
   const files = watch('images') as FileList | undefined
 
   useEffect(() => {
     setValue('type', initialType)
   }, [initialType, setValue])
 
   const onSubmit = async (data: ItemFormValues) => {
     setFormError(null)
 
     const {
       data: { user },
     } = await supabase.auth.getUser()
     if (!user) {
       router.push('/login')
       return
     }
 
     const itemId = crypto.randomUUID()
     const imageUrls: string[] = []
 
     if (files && files.length) {
       const uploads = Array.from(files).map(async (file, idx) => {
         const path = `${user.id}/${itemId}/${Date.now()}-${idx}-${file.name}`
         const { error } = await supabase.storage.from('item-images').upload(path, file, {
           upsert: true,
         })
         if (error) throw error
         const { data: pub } = supabase.storage.from('item-images').getPublicUrl(path)
         imageUrls.push(pub.publicUrl)
       })
       try {
         await Promise.all(uploads)
       } catch (e: unknown) {
         const err = e as { message?: string }
        const msg = err?.message ?? 'Failed to upload images'
        if (msg.toLowerCase().includes('bucket not found')) {
          setFormError('Storage bucket "item-images" not found. Create a public bucket named "item-images" in Supabase Storage.')
          // Proceed without images
        } else {
          setFormError(msg)
          return
        }
       }
     }
 
     const lat = data.latitude && data.latitude.length ? parseFloat(data.latitude) : undefined
     const lon = data.longitude && data.longitude.length ? parseFloat(data.longitude) : undefined
 
     const payload = {
       id: itemId,
       user_id: user.id,
       title: data.title,
       description: data.description,
       type: data.type,
       category: data.category,
       location_name: data.location_name ?? null,
       latitude: lat ?? null,
       longitude: lon ?? null,
       date_lost_found: data.date_lost_found ?? null,
       images: imageUrls.length ? imageUrls : null,
     }
 
    try {
      await createItem(payload as never)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to create item'
      setFormError(msg)
      return
    }
 
     router.push('/dashboard')
   }
 
   return (
     <div className="min-h-screen w-full flex items-start justify-center bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4 }}
         className="w-full max-w-2xl"
       >
         <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-xl backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90">
           <CardHeader>
             <CardTitle className="text-2xl font-bold tracking-tight">
               {initialType === 'lost' ? 'Report Lost Item' : 'Report Found Item'}
             </CardTitle>
             <CardDescription>
               Provide as much detail as possible to help with matching.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="title">Title</Label>
                   <Input id="title" {...register('title')} placeholder="e.g., Black iPhone 14" />
                   {errors.title && (
                     <p className="text-sm text-red-600">{errors.title.message}</p>
                   )}
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="category" className="flex items-center gap-2">
                     <Tag className="h-4 w-4 text-zinc-500" /> Category
                   </Label>
                   <select
                     id="category"
                     {...register('category')}
                     className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                   >
                     <option value="" disabled>
                       Select a category
                     </option>
                     {CATEGORIES.map((c) => (
                       <option key={c} value={c}>
                         {c[0].toUpperCase() + c.slice(1)}
                       </option>
                     ))}
                   </select>
                   {errors.category && (
                     <p className="text-sm text-red-600">{errors.category.message}</p>
                   )}
                 </div>
               </div>
 
               <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe the item, brand, color, unique marks, etc."
                  className="min-h-24 w-full"
                />
                {errors.description && (
                   <p className="text-sm text-red-600">{errors.description.message}</p>
                 )}
               </div>
 
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="date_lost_found" className="flex items-center gap-2">
                     <CalendarDays className="h-4 w-4 text-zinc-500" /> Date
                   </Label>
                   <Input id="date_lost_found" type="date" {...register('date_lost_found')} />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="location_name" className="flex items-center gap-2">
                     <MapPin className="h-4 w-4 text-zinc-500" /> Location
                   </Label>
                   <Input
                     id="location_name"
                     {...register('location_name')}
                     placeholder="e.g., Central Park, NYC"
                   />
                 </div>
               </div>
 
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" /> Choose Location
                </Label>
                <div className="h-72 w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <Map
                    items={[]}
                    selectable
                    selectedPosition={selectedPos}
                    onSelect={(lat, lng) => {
                      setSelectedPos([lat, lng])
                      setValue('latitude', String(lat))
                      setValue('longitude', String(lng))
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {selectedPos
                    ? `Selected: ${selectedPos[0].toFixed(5)}, ${selectedPos[1].toFixed(5)}`
                    : 'Click on the map to choose a location. Drag the marker to adjust.'}
                </p>
              </div>
 
               <div className="space-y-2">
                 <Label htmlFor="images" className="flex items-center gap-2">
                   <ImageIcon className="h-4 w-4 text-zinc-500" /> Images
                 </Label>
                 <input
                   id="images"
                   type="file"
                   multiple
                   accept="image/*"
                   {...register('images')}
                   className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                 />
                 <p className="text-xs text-zinc-500">Up to 5 images recommended</p>
               </div>
 
               {formError && <p className="text-sm text-red-600">{formError}</p>}
 
               <div className="flex items-center justify-end gap-4">
                 <Button type="button" variant="ghost" onClick={() => router.back()}>
                   Cancel
                 </Button>
                 <Button
                   type="submit"
                   className="bg-blue-600 hover:bg-blue-700 text-white"
                   disabled={isSubmitting}
                 >
                   {isSubmitting ? 'Submitting...' : 'Submit'}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   )
 }
 
