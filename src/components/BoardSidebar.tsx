// import { ApiResponse } from '@/utils/ApiResponse'
// import axios, { AxiosError } from 'axios'
// import { Session } from 'next-auth'
// import { getSession } from 'next-auth/react'
// import React, { useEffect, useState } from 'react'
// import { toast } from 'sonner'
// import { SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarProvider } from './ui/sidebar'
// import { Sidebar, Star } from 'lucide-react'
// import Link from 'next/link'

// interface Board {
//     name: string,
//     bgColor: string,
//     url: string,
//     _id: string,
//     isStarred: boolean
// }

// const BoardSidebar = () => {
//     const [userData, setUserData] = useState<Session | null>(null)
//     const [boards, setBoards] = useState<Board[]>([])
//     const [boardLoading, setBoardLoading] = useState(false)
//     const [starredBoards, setStarredBoards] = useState<Board[]>([])
//     const [starredBoardLoading, setStarredBoardLoading] = useState(false)

//     useEffect(() => {
//         const fetchAuthenticatedUser = async () => {
//             const sessionData = await getSession()
//             setUserData(sessionData)
//         }
//         fetchAuthenticatedUser()
//     }, [])

//     useEffect(() => {
//         const fetchUserBoards = async () => {
//             try {
//                 setBoardLoading(true)
//                 const response = await axios.get('/api/boards/getAllUserBoards')
//                 setBoards(response.data.data.boards)

//             } catch (error) {
//                 console.log("Error fetching user boards");
//                 const axiosError = error as AxiosError<ApiResponse>
//                 const errMsg = axiosError.response?.data.message

//                 toast.error('Failed to fetch boards', {
//                     description: errMsg
//                 })
//             } finally {
//                 setBoardLoading(false)
//             }
//         }

//         fetchUserBoards()
//     }, [])


//     useEffect(() => {
//         const fetchStarredBoards = async () => {
//             try {
//                 setStarredBoardLoading(true)
//                 const response = await axios.get('/api/boards/getStarredBoards')
//                 setStarredBoards(response.data.data.boards)

//                 console.log("Starred response: ", response)
//             } catch (error) {
//                 console.log("Error fetching starred boards");
//                 const axiosError = error as AxiosError<ApiResponse>
//                 const errMsg = axiosError.response?.data.message

//                 toast.error('Failed to fetch starred boards', {
//                     description: errMsg
//                 })
//             } finally {
//                 setStarredBoardLoading(false)
//             }
//         }

//         fetchStarredBoards()
//     }, [])

//     useEffect(() => {
//         if (boards.length > 0 && !boardLoading && !starredBoardLoading) {
//             const starredBoardIds = new Set(starredBoards.map((board) => board._id))

//             const needsUpdate = boards.some(board =>
//                 starredBoardIds.has(board._id) !== board.isStarred
//             )

//             if (needsUpdate) {
//                 const updatedBoards = boards.map((board) => ({
//                     ...board,
//                     isStarred: starredBoardIds.has(board._id)
//                 }))
//                 setBoards(updatedBoards)
//             }
//         }
//     }, [starredBoards, boardLoading, starredBoardLoading, boards])
//     return (
//         <div>
//             <Sidebar>

//                 <SidebarContent>
//                     <SidebarGroup>
//                         <SidebarGroupLabel>{userData?.user.name}</SidebarGroupLabel>
//                         <SidebarGroupContent>
//                             <SidebarMenu>
//                                 {boards.map((board) => (
//                                     <Link
//                                         key={board._id}
//                                         href={`/b/${board.url}/${board.name.trim().toLowerCase().replace(/\s+/g, '-')}`}
//                                     >
//                                         <div className='my-1 hover:bg-slate-700 rounded p-1'>
//                                             <div className='flex justify-between items-center'>
//                                                 <div className='flex items-center gap-2 text-gray-300 text-sm font-semibold'>
//                                                     <div className={`w-5 h-5 rounded ${board.bgColor}`}></div>
//                                                     {board.name}
//                                                 </div>
//                                                 {board.isStarred ? (
//                                                     <Star fill='yellow' strokeWidth={0.5} className='h-3 w-3 mr-3' />
//                                                 ) : (
//                                                     <Star className='h-3 w-3 mr-3' />
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </Link>
//                                 ))}
//                             </SidebarMenu>
//                         </SidebarGroupContent>
//                     </SidebarGroup>
//                 </SidebarContent>
//             </Sidebar>
//         </div>
//     )
// }

// export default BoardSidebar



























import { ApiResponse } from '@/utils/ApiResponse'
import axios, { AxiosError } from 'axios'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarTrigger } from './ui/sidebar'
import { Star } from 'lucide-react'
import Link from 'next/link'
import { Separator } from './ui/separator'

interface Board {
    name: string,
    bgColor: string,
    url: string,
    _id: string,
    isStarred: boolean
}

const BoardSidebar = () => {
    const [userData, setUserData] = useState<Session | null>(null)
    const [boards, setBoards] = useState<Board[]>([])
    const [boardLoading, setBoardLoading] = useState(false)
    const [starredBoards, setStarredBoards] = useState<Board[]>([])
    const [starredBoardLoading, setStarredBoardLoading] = useState(false)

    useEffect(() => {
        const fetchAuthenticatedUser = async () => {
            const sessionData = await getSession()
            setUserData(sessionData)
        }
        fetchAuthenticatedUser()
    }, [])

    useEffect(() => {
        const fetchUserBoards = async () => {
            try {
                setBoardLoading(true)
                const response = await axios.get('/api/boards/getAllUserBoards')
                setBoards(response.data.data.boards)

            } catch (error) {
                console.log("Error fetching user boards");
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message

                toast.error('Failed to fetch boards', {
                    description: errMsg
                })
            } finally {
                setBoardLoading(false)
            }
        }

        fetchUserBoards()
    }, [])


    useEffect(() => {
        const fetchStarredBoards = async () => {
            try {
                setStarredBoardLoading(true)
                const response = await axios.get('/api/boards/getStarredBoards')
                setStarredBoards(response.data.data.boards)

            } catch (error) {
                console.log("Error fetching starred boards");
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message

                toast.error('Failed to fetch starred boards', {
                    description: errMsg
                })
            } finally {
                setStarredBoardLoading(false)
            }
        }

        fetchStarredBoards()
    }, [])

    useEffect(() => {
        if (boards.length > 0 && !boardLoading && !starredBoardLoading) {
            const starredBoardIds = new Set(starredBoards.map((board) => board._id))

            const needsUpdate = boards.some(board =>
                starredBoardIds.has(board._id) !== board.isStarred
            )

            if (needsUpdate) {
                const updatedBoards = boards.map((board) => ({
                    ...board,
                    isStarred: starredBoardIds.has(board._id)
                }))
                setBoards(updatedBoards)
            }
        }
    }, [starredBoards, boardLoading, starredBoardLoading, boards])

    return (
        <div className="">
            <Sidebar className='h-full top-16 overflow-y-auto border-r bg-slate-800'>
                <SidebarHeader className='px-3 mt-2 flex justify-center items-center'>
                    <div className='w-full'>{userData?.user.name}'s Workspace</div>
                    <Separator className='bg-gray-400'/>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className='text-sm'>Your Boards</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {boards.map((board) => (
                                    <Link
                                        key={board._id}
                                        href={`/b/${board.url}/${board.name.trim().toLowerCase().replace(/\s+/g, '-')}`}
                                    >
                                        <div className='my-1 hover:bg-slate-700 rounded p-1'>
                                            <div className='flex justify-between items-center'>
                                                <div className='flex items-center gap-2 text-gray-300 text-sm font-semibold'>
                                                    <div className={`w-5 h-5 rounded ${board.bgColor}`}></div>
                                                    {board.name}
                                                </div>
                                                {board.isStarred ? (
                                                    <Star fill='yellow' strokeWidth={0.5} className='h-4 w-4 mr-3' />
                                                ) : (
                                                    <Star className='h-4 w-4 mr-3' />
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </div>
    )
}

export default BoardSidebar