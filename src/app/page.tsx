"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Grid, List, Users, Plus, NotebookPen, SquareKanban } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()
  const username = session?.user?.username
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-100">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <motion.h1
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="text-4xl sm:text-5xl font-extrabold leading-tight"
          >
            Organize teamwork. Move faster. Ship together.
          </motion.h1>

          <p className="mt-4 text-slate-300 max-w-xl">
            Atlas is a lightweight, flexible project board for teams of any size. Visualize work, collaborate in real time, and keep every project moving forward.
          </p>

          <div className="mt-6 flex gap-3">
            <Link href={`/u/${username}/boards`}>
              <Button className="px-6 py-3" size="lg">Get started — it's free</Button>
            </Link>
          </div>

          <div className="mt-6 flex gap-4 items-center text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="bg-slate-700 px-2 py-1 rounded">Free forever</div>
              <div>•</div>
              <div>Team-friendly permissions</div>
              <div>•</div>
              <div>Integrations</div>
            </div>
          </div>


        </div>

        <div className="relative">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex gap-4">
              <div className="w-64 space-y-3">
                <div className="h-8 bg-slate-600 rounded" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="bg-slate-700 rounded p-3">
                      <div className="h-3 bg-slate-600 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-slate-600 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-64 space-y-3">
                <div className="h-8 bg-slate-600 rounded" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-slate-700 rounded p-3">
                      <div className="h-3 bg-slate-600 rounded w-2/3 mb-2" />
                      <div className="h-2 bg-slate-600 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-64 space-y-3 hidden sm:block">
                <div className="h-8 bg-slate-600 rounded" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="bg-slate-700 rounded p-3">
                      <div className="h-3 bg-slate-600 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-slate-600 rounded w-1/4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-slate-800">
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-700 rounded">
                  <Grid />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Visual Boards</h3>
                  <p className="text-sm text-slate-300 mt-1">Drag-and-drop lists and cards to shape your workflow.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6 bg-slate-800">
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-700 rounded">
                  <Users />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Collaboration</h3>
                  <p className="text-sm text-slate-300 mt-1">Assign members, comment, and track activity in real time.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6 bg-slate-800">
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-700 rounded">
                  <List />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Integrations</h3>
                  <p className="text-sm text-slate-300 mt-1">Connect your favorite tools and automate repetitive tasks.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 py-12 text-center">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold">Ready to organize your team?</h2>
          <p className="text-slate-300 mt-3">Create your first board and move from idea to done — together.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href={'/sign-in'}>
              <Button className="px-6 py-3">Start for free</Button>
            </Link>
            <Link href={`/u/${username}/boards`}>
              <Button variant="ghost" className="px-6 py-3 flex items-center gap-2"><Plus /> Create board</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
        <h3 className="text-center text-xl font-semibold mb-10">Organize your work in three simple steps</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 bg-slate-800 text-center">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-slate-700 rounded-full">
                  <SquareKanban />
                </div>
              </div>
              <h4 className="text-lg font-semibold">1. Create a Board</h4>
              <p className="text-sm text-slate-300 mt-2">
                Set up a board for your team or project. Add lists for each stage of your workflow.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 bg-slate-800 text-center">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-slate-700 rounded-full">
                  <NotebookPen />
                </div>
              </div>
              <h4 className="text-lg font-semibold">2. Add & Assign Tasks</h4>
              <p className="text-sm text-slate-300 mt-2">
                Break work into tasks, assign team members, set due dates, and attach files.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 bg-slate-800 text-center">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-slate-700 rounded-full">
                  <Check />
                </div>
              </div>
              <h4 className="text-lg font-semibold">3. Track Progress</h4>
              <p className="text-sm text-slate-300 mt-2">
                Move tasks across lists, track progress in real-time, and hit your deadlines.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* FOOTER */}
      <footer className="border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-md p-2">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="4" width="7" height="5" rx="1" fill="white" />
                <rect x="14" y="4" width="7" height="5" rx="1" fill="white" />
                <rect x="3" y="15" width="7" height="5" rx="1" fill="white" />
                <rect x="14" y="15" width="7" height="5" rx="1" fill="white" />
              </svg>
            </div>
            <div>
              <div className="font-sansation font-semibold">Atlas</div>
              <div className="text-xs text-slate-400">Trello-like boards for teams</div>
            </div>
          </div>

          <div className="text-sm text-slate-400">© {new Date().getFullYear()} Atlas — Built with ❤️</div>
        </div>
      </footer>
    </main>
  )
}
