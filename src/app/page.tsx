'use client';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground overflow-hidden">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-background">
             <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
          </div>

          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col justify-center space-y-8"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                    🎉 New: AI-Powered Matching
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 dark:to-purple-300">
                    Lost it? <br/> Let&apos;s find it.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                    The modern community-driven platform to reunite you with your belongings. Secure, fast, and free to use.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Link href="/items/create?type=lost">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                      Report Lost Item
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                      Search Database
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                     {[1, 2, 3, 4].map((i) => (
                       <div key={i} className={`h-8 w-8 rounded-full border-2 border-background bg-gray-${i*100} dark:bg-gray-800`} />
                     ))}
                  </div>
                  <p>Trusted by 10,000+ users</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto lg:ml-auto"
              >
                 <div className="relative rounded-xl border bg-card p-2 shadow-2xl shadow-primary/10">
                    <div className="rounded-lg border bg-background p-8 min-w-[300px] md:min-w-[400px]">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900/30">
                             <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div>
                             <h3 className="font-semibold text-lg">Match Found!</h3>
                             <p className="text-sm text-muted-foreground">Just now</p>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                          <div className="mt-4 h-32 rounded-lg bg-muted/50 flex items-center justify-center">
                             <MapPin className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
             <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {[
                  { icon: MapPin, title: "Location Aware", desc: "Pinpoint exactly where you lost or found an item." },
                  { icon: Search, title: "Smart Search", desc: "Our algorithm matches descriptions automatically." },
                  { icon: ShieldCheck, title: "Secure Chat", desc: "Connect with others without revealing private info." }
                ].map((feature, i) => (
                   <motion.div 
                      key={i}
                      whileHover={{ y: -5 }}
                      className="flex flex-col items-center text-center p-6 bg-background rounded-xl shadow-sm border"
                   >
                      <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                         <feature.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.desc}</p>
                   </motion.div>
                ))}
             </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lost & Found. Built for community.
          </p>
          <div className="flex gap-4 text-sm font-medium text-muted-foreground">
             <Link href="#" className="hover:text-primary">Privacy</Link>
             <Link href="#" className="hover:text-primary">Terms</Link>
             <Link href="#" className="hover:text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
