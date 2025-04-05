'use client'
import BoardSidebar from "@/components/BoardSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <BoardSidebar />
        <main className="flex-1 relative min-h-screen overflow-auto">
        {/* <main className="flex-1 relative min-h-screen overflow-auto"> */}
          <SidebarTrigger className="absolute top-1 left-1 z-10 hover:bg-gray-300 hover:text-black" />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}




// 'use client'
// import BoardSidebar from "@/components/BoardSidebar"
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

// export default function Layout({ children }: { children: React.ReactNode }) {
//   return (
//     <SidebarProvider>
//       <div className="flex overflow-hidden h-s w-full">
//         <BoardSidebar />
//         <main className="relative">
//           <SidebarTrigger className="absolute top-1 left-1 z-10 hover:bg-gray-300 hover:text-black" />
//           <div className="w-full">
//             {children}
//           </div>
//         </main> 
//       </div>
//     </SidebarProvider>
//   )
// }