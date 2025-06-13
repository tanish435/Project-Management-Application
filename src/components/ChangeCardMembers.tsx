'use client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Ellipsis, X } from 'lucide-react'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/utils/ApiResponse'
import { toast } from 'sonner'
import { useState } from 'react'

interface User {
    _id: string,
    fullName: string,
    username: string;
    email: string;
    avatar: string;
    initials: string
}

interface Props {
    cardId: string
    cardMembers: User[]
    setCardMembers: React.Dispatch<React.SetStateAction<User[]>>
    boardMembers: User[]
    trigger?: any
}

const ChangeCardMembers = ({ cardId, cardMembers, setCardMembers, boardMembers, trigger }: Props) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    
    const filteredBoardMembers = boardMembers.filter(
        (boardMember) => !cardMembers?.some((cardMember) => cardMember._id === boardMember._id)
    )

    const addMembersToCard = async (member: User, event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        try {
            const response = await axios.patch(`/api/cards/addMembersToCard/${cardId}`, {
                memberId: member._id
            })

            if (response?.data?.success) {
                setCardMembers(prev => [...prev, member])
                toast.success('Member added')
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            toast.error('Failed to add member', {
                description: axiosError.response?.data.message
            })
        }
    }

    const removeMembersFromCard = async (memberId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        event.preventDefault();

        try {
            const response = await axios.patch(`/api/cards/removeCardMembers/${cardId}`, {
                memberId
            })

            if (response?.data?.success) {
                setCardMembers(prev => prev.filter(member => member._id !== memberId))
                toast.success('Member removed')
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            toast.error('Failed to remove member', {
                description: axiosError.response?.data.message
            })
        }
    }

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button 
                    className="h-8 w-max rounded hover:bg-transparent bg-transparent shadow-none justify-start" 
                    data-stop-dialog-open
                    onClick={(e) => {
                        setIsPopoverOpen(true)
                        e.stopPropagation();
                        setIsPopoverOpen(!isPopoverOpen);
                    }}
                >
                    {trigger ? trigger : <span className='text-sm font-light w-full flex justify-start'>Change Members</span>}
                </Button>
            </PopoverTrigger>

            <PopoverContent 
                className="w-64 z-[9999] pointer-events-auto" 
                align="start" 
                side="right" 
                sideOffset={8}
                avoidCollisions={true}
                onPointerDownOutside={(e) => {
                    // Prevent closing when clicking on dropdown items
                    const target = e.target as Element;
                    if (target.closest('[data-radix-dropdown-menu-content]')) {
                        e.preventDefault();
                    }
                }}
                onInteractOutside={(e) => {
                    // Keep popover open when interacting with dropdown
                    const target = e.target as Element;
                    if (target.closest('[data-radix-dropdown-menu-content]')) {
                        e.preventDefault();
                    }
                }}
                onMouseLeave={(e) => {
                    // Add slight delay before closing
                    const relatedTarget = e.relatedTarget as Element;
                    if (!relatedTarget?.closest('[data-radix-dropdown-menu-content]') && 
                        !relatedTarget?.closest('[data-radix-popper-content-wrapper]')) {
                        setTimeout(() => setIsPopoverOpen(false), 150);
                    }
                }}
            >
                <div>
                    {cardMembers?.length > 0 && (
                        <>
                            <p className="text-xs text-muted-foreground mb-1">Card Members</p>
                            {cardMembers.map((member) => (
                                <div key={member._id} onClick={(e) => removeMembersFromCard(member._id, e)} className="mb-1 flex items-center justify-between cursor-pointer hover:bg-muted rounded p-1">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{member.initials}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{member.username}</span>
                                    </div>
                                    <X className="w-3 h-3" />
                                </div>
                            ))}
                        </>
                    )}

                    {filteredBoardMembers.length > 0 && (
                        <>
                            <p className="text-xs text-muted-foreground mt-2 mb-1">Board Members</p>
                            {filteredBoardMembers.map((member) => (
                                <div key={member._id} onClick={(e) => addMembersToCard(member, e)} className="mb-1 flex items-center gap-2 cursor-pointer hover:bg-muted rounded p-1">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{member.username}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default ChangeCardMembers








// const ChangeCardMembers = ({ cardId, cardMembers, setCardMembers, boardMembers, trigger }: Props) => {
//     const filteredBoardMembers = boardMembers.filter(
//         (boardMember) => !cardMembers?.some((cardMember) => cardMember._id === boardMember._id)
//     )

//     const addMembersToCard = async (member: User, event: React.MouseEvent) => {
//         event.stopPropagation();
//         event.preventDefault();

//         try {
//             const response = await axios.patch(`/api/cards/addMembersToCard/${cardId}`, {
//                 memberId: member._id
//             })

//             if (response?.data?.success) {
//                 setCardMembers(prev => [...prev, member])
//                 toast.success('Member added')
//             }
//         } catch (error) {
//             const axiosError = error as AxiosError<ApiResponse>
//             toast.error('Failed to add member', {
//                 description: axiosError.response?.data.message
//             })
//         }
//     }

//     const removeMembersFromCard = async (memberId: string, event: React.MouseEvent) => {
//         event.stopPropagation()
//         event.preventDefault();

//         try {
//             const response = await axios.patch(`/api/cards/removeCardMembers/${cardId}`, {
//                 memberId
//             })

//             if (response?.data?.success) {
//                 setCardMembers(prev => prev.filter(member => member._id !== memberId))
//                 toast.success('Member removed')
//             }
//         } catch (error) {
//             const axiosError = error as AxiosError<ApiResponse>
//             toast.error('Failed to remove member', {
//                 description: axiosError.response?.data.message
//             })
//         }
//     }

//     return (
//         <Popover>
//             <PopoverTrigger asChild>
//                 <Button className="h-8 w-max hover:bg-transparent bg-transparent shadow-none" data-stop-dialog-open>
//                     {trigger ? trigger : <span className='text-sm font-light'>Change Members</ span>}
//                 </Button>
//             </PopoverTrigger>

//             <PopoverContent className="w-64 z-[9999] pointer-events-auto"  align="start" side="bottom" sideOffset={8} >
//                 <div>
//                 {cardMembers?.length > 0 && (
//                     <>
//                         <p className="text-xs text-muted-foreground mb-1">Card Members</p>
//                         {cardMembers.map((member) => (
//                             <div key={member._id} onClick={(e) => removeMembersFromCard(member._id, e)} className="mb-1 flex items-center justify-between cursor-pointer hover:bg-muted rounded p-1">
//                                 <div className="flex items-center gap-2">
//                                     <Avatar className="h-6 w-6">
//                                         <AvatarImage src={member.avatar} />
//                                         <AvatarFallback>{member.initials}</AvatarFallback>
//                                     </Avatar>
//                                     <span className="text-sm">{member.username}</span>
//                                 </div>
//                                 <X className="w-3 h-3" />
//                             </div>
//                         ))}
//                     </>
//                 )}

//                 {filteredBoardMembers.length > 0 && (
//                     <>
//                         <p className="text-xs text-muted-foreground mt-2 mb-1">Board Members</p>
//                         {filteredBoardMembers.map((member) => (
//                             <div key={member._id} onClick={(e) => addMembersToCard(member, e)} className="mb-1 flex items-center gap-2 cursor-pointer hover:bg-muted rounded p-1">
//                                 <Avatar className="h-6 w-6">
//                                     <AvatarImage src={member.avatar} />
//                                     <AvatarFallback>{member.initials}</AvatarFallback>
//                                 </Avatar>
//                                 <span className="text-sm">{member.username}</span>
//                             </div>
//                         ))}
//                     </>
//                 )}
//                 </div>
//             </PopoverContent>
//         </Popover>
//     )
// }

// export default ChangeCardMembers














// 'use client'
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from '@/components/ui/popover'
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// import { Button } from '@/components/ui/button'
// import { Ellipsis, X } from 'lucide-react'
// import axios, { AxiosError } from 'axios'
// import { ApiResponse } from '@/utils/ApiResponse'
// import { toast } from 'sonner'
// import { useEffect, useRef, useState } from 'react'

// interface User {
//     _id: string,
//     fullName: string,
//     username: string;
//     email: string;
//     avatar: string;
//     initials: string
// }

// interface Props {
//     cardId: string
//     cardMembers: User[]
//     setCardMembers: React.Dispatch<React.SetStateAction<User[]>>
//     boardMembers: User[]
//     trigger?: any
// }

// const ChangeCardMembers = ({ cardId, cardMembers, setCardMembers, boardMembers, trigger }: Props) => {
//     const [isPopoverOpen, setIsPopoverOpen] = useState(false);
//     const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
//     const filteredBoardMembers = boardMembers.filter(
//         (boardMember) => !cardMembers?.some((cardMember) => cardMember._id === boardMember._id)
//     )

//     const addMembersToCard = async (member: User, event: React.MouseEvent) => {
//         event.stopPropagation();
//         event.preventDefault();

//         try {
//             const response = await axios.patch(`/api/cards/addMembersToCard/${cardId}`, {
//                 memberId: member._id
//             })

//             if (response?.data?.success) {
//                 setCardMembers(prev => [...prev, member])
//                 toast.success('Member added')
//             }
//         } catch (error) {
//             const axiosError = error as AxiosError<ApiResponse>
//             toast.error('Failed to add member', {
//                 description: axiosError.response?.data.message
//             })
//         }
//     }

//     const removeMembersFromCard = async (memberId: string, event: React.MouseEvent) => {
//         event.stopPropagation()
//         event.preventDefault();

//         try {
//             const response = await axios.patch(`/api/cards/removeCardMembers/${cardId}`, {
//                 memberId
//             })

//             if (response?.data?.success) {
//                 setCardMembers(prev => prev.filter(member => member._id !== memberId))
//                 toast.success('Member removed')
//             }
//         } catch (error) {
//             const axiosError = error as AxiosError<ApiResponse>
//             toast.error('Failed to remove member', {
//                 description: axiosError.response?.data.message
//             })
//         }
//     }

//     const handleClick = (event: React.MouseEvent) => {
//         event.stopPropagation();
//         event.preventDefault();
//         setIsPopoverOpen(!isPopoverOpen);
//     };

//     const handleMouseLeave = () => {
//         // Only handle mouse leave if popover is open
//         if (!isPopoverOpen) return;

//         // Simple delay to allow moving to popover
//         timeoutRef.current = setTimeout(() => {
//             setIsPopoverOpen(false);
//         }, 300); // Increased timeout for better UX
//     };

//     const handlePopoverMouseEnter = () => {
//         // Clear timeout when entering popover
//         if (timeoutRef.current) {
//             clearTimeout(timeoutRef.current);
//             timeoutRef.current = null;
//         }
//     };

//     const handlePopoverMouseLeave = () => {
//         // Close immediately when leaving popover
//         setIsPopoverOpen(false);
//     };

//     const handleTriggerMouseEnter = () => {
//         // Clear timeout when re-entering trigger (if popover is open)
//         if (timeoutRef.current && isPopoverOpen) {
//             clearTimeout(timeoutRef.current);
//             timeoutRef.current = null;
//         }
//     };

//     // Cleanup timeout on unmount
//     useEffect(() => {
//         return () => {
//             if (timeoutRef.current) {
//                 clearTimeout(timeoutRef.current);
//             }
//         };
//     }, []);

//     return (
//         <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
//             <PopoverTrigger asChild>
//                 <Button 
//                     className="h-8 w-max hover:bg-transparent bg-transparent shadow-none justify-start" 
//                     data-stop-dialog-open
//                     onClick={handleClick}
//                     onMouseEnter={handleTriggerMouseEnter}
//                     onMouseLeave={handleMouseLeave}
//                 >
//                     {trigger ? trigger : <span className='text-sm font-light'>Change Members</span>}
//                 </Button>
//             </PopoverTrigger>

//             <PopoverContent 
//                 className="w-64 z-[9999] pointer-events-auto p-2" 
//                 align="start" 
//                 side="bottom" 
//                 sideOffset={8}
//                 onMouseEnter={handlePopoverMouseEnter}
//                 onMouseLeave={handlePopoverMouseLeave}
//                 // Prevent the popover from closing when clicking inside
//                 onInteractOutside={(e) => {
//                     const target = e.target as Element;
//                     if (target.closest('[data-stop-dialog-open]')) {
//                         e.preventDefault();
//                     }
//                 }}
//             >
//                 {cardMembers?.length > 0 && (
//                     <>
//                         <p className="text-xs text-muted-foreground mb-1">Card Members</p>
//                         {cardMembers.map((member) => (
//                             <div 
//                                 key={member._id} 
//                                 onClick={(e) => removeMembersFromCard(member._id, e)} 
//                                 className="mb-1 flex items-center justify-between cursor-pointer hover:bg-muted rounded p-1"
//                             >
//                                 <div className="flex items-center gap-2">
//                                     <Avatar className="h-6 w-6">
//                                         <AvatarImage src={member.avatar} />
//                                         <AvatarFallback>{member.initials}</AvatarFallback>
//                                     </Avatar>
//                                     <span className="text-sm">{member.username}</span>
//                                 </div>
//                                 <X className="w-3 h-3" />
//                             </div>
//                         ))}
//                     </>
//                 )}

//                 {filteredBoardMembers.length > 0 && (
//                     <>
//                         <p className="text-xs text-muted-foreground mt-2 mb-1">Board Members</p>
//                         {filteredBoardMembers.map((member) => (
//                             <div 
//                                 key={member._id} 
//                                 onClick={(e) => addMembersToCard(member, e)} 
//                                 className="mb-1 flex items-center gap-2 cursor-pointer hover:bg-muted rounded p-1"
//                             >
//                                 <Avatar className="h-6 w-6">
//                                     <AvatarImage src={member.avatar} />
//                                     <AvatarFallback>{member.initials}</AvatarFallback>
//                                 </Avatar>
//                                 <span className="text-sm">{member.username}</span>
//                             </div>
//                         ))}
//                     </>
//                 )}
//             </PopoverContent>
//         </Popover>
//     )
// }

// export default ChangeCardMembers