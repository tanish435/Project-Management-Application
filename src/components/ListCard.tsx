import React, { useEffect, useState } from 'react'
import { Badge } from './ui/badge';
import { Ellipsis, ListChecks, MessageSquare, Paperclip, Text, X } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/utils/ApiResponse';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "./ui/context-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import ChangeMembersPopoverTemplate from './ChangeMembersPopoverTemplate';
import { DropdownMenuSubTrigger } from '@radix-ui/react-dropdown-menu';

interface User {
    _id: string,
    fullName: string,
    username: string;
    email: string;
    avatar: string;
    initials: string
}

interface Card {
    _id: string;
    name: string;
    description: string;
    position: number;
    dueDate: string;
    comments: number;
    checklists: number;
    attachments: number;
    slug: string
}

interface props {
    cardInfo: Card
    boardMembers: User[]
}

const ListCard = ({ cardInfo, boardMembers }: props) => {
    const [dueDate, setDueDate] = useState(cardInfo.dueDate)
    const [cardMembers, setCardMembers] = useState<User[]>([])

    const filteredBoardMembers = boardMembers.filter(
        (boardMember) => !cardMembers.some((cardMember) => cardMember._id === boardMember._id)
    );

    const date = new Date(dueDate)
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date)

    const addMembersToCard = async (member: User) => {
        try {
            const response = await axios.patch(`/api/cards/addMembersToCard/${cardInfo._id}`, {
                memberId: member._id
            })

            if (response?.data?.success) {
                setCardMembers((prevMembers) => [...prevMembers, member])
                toast.success('Member added to card successfully')
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to add members to card', {
                description: errMsg
            })
        }
    }

    const removeMembersFromCard = async (memberId: string) => {
        try {
            const response = await axios.patch(`/api/cards/removeCardMembers/${cardInfo._id}`, {
                memberId: memberId
            })

            if (response?.data?.success) {
                setCardMembers((prevMembers) => prevMembers.filter(member => member._id !== memberId))
                toast.success('Member removed from card successfully')
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to remove members from card', {
                description: errMsg
            })
        }
    }

    useEffect(() => {
        const getCardMembers = async () => {
            try {
                const response = await axios.get(`/api/cards/getCardMembers/${cardInfo._id}`)
                if (response?.data?.success) {
                    setCardMembers(response.data.data[0].members)
                }
            } catch (error) {
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message

                toast.error('Failed to fetch board info', {
                    description: errMsg
                })
            }
        }

        getCardMembers()
    }, [])

    useEffect(() => {
        console.log("boardMembers", boardMembers);
    }, [boardMembers]);


    return (
        <div className='w-full bg-gray-800 p-2 rounded-md'>
            <div className='flex justify-between items-center'>

                <span className='text-sm ml-[1px]'>{cardInfo.name}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger className='bg-gray-800 hover:bg-gray-700 text-xs rounded flex justify-center items-center text-white p-0 h-6 w-6'><Ellipsis className='h-4 w-4' /></DropdownMenuTrigger>
                    <DropdownMenuContent className="w-44">

                        <DropdownMenuGroup>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className='text-sm px-2 py-1.5'>Change members</DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className='w-64'>
                                        {cardMembers.length > 0 &&
                                            <>
                                                <DropdownMenuLabel className='text-gray-400 text-xs'>Card members</DropdownMenuLabel>
                                                {cardMembers.map((member) => (
                                                    <div 
                                                    onClick={() => removeMembersFromCard(member._id)}
                                                    key={member._id}
                                                    >
                                                        <DropdownMenuItem className='bg-slate-60 mb-1 flex justify-between'>
                                                            <div className='flex gap-1 items-center'>
                                                                <Avatar className='h-7 w-7'>
                                                                    <AvatarImage src={member.avatar} alt={member.username} />
                                                                    <AvatarFallback className='text-xs'>{member.initials}</AvatarFallback>
                                                                </Avatar>
                                                                <span>{member.username}</span>
                                                            </div>
                                                            <X className='w-3 h-3' />
                                                        </DropdownMenuItem>
                                                    </div>
                                                ))}
                                            </>
                                        }
                                        {filteredBoardMembers.length > 0 &&
                                            <>
                                                <DropdownMenuLabel className='text-gray-400 text-xs'>Board members</DropdownMenuLabel>

                                                {filteredBoardMembers.map((member) => (
                                                    <div
                                                        onClick={() => addMembersToCard(member)}
                                                        key={member._id}
                                                    >
                                                        <DropdownMenuItem className='bg-slate-60 mb-1'>
                                                            <Avatar className='h-7 w-7'>
                                                                <AvatarImage src={member.avatar} alt={member.username} />
                                                                <AvatarFallback className='text-xs'>{member.initials}</AvatarFallback>
                                                            </Avatar>
                                                            <span>{member.username}</span>
                                                        </DropdownMenuItem>
                                                    </div>
                                                ))}
                                            </>
                                        }
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>More...</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </DropdownMenuGroup>
                        <DropdownMenuItem>
                            Delete card
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className='flex flex-wrap gap-2 mt-1'>
                {dueDate !== null && (
                    <Badge className='text-gray-400 '>{formattedDate}</Badge>
                )}
                {cardInfo.description.trim() !== '' && (
                    <span className='flex items-center'>
                        <Text className='h-3 w-3' />
                    </span>
                )}
                {cardInfo.attachments > 0 && (
                    <span className='flex items-center justify-center gap-1 text-xs'>
                        <Paperclip className='h-3 w-3' />
                        {cardInfo.attachments}
                    </span>
                )}
                {cardInfo.comments > 0 && (
                    <span className='flex items-center justify-center gap-1 text-xs'>
                        <MessageSquare className='h-3 w-3' />
                        {cardInfo.comments}
                    </span>
                )}
                {cardInfo.checklists > 0 && (
                    <span className='flex items-center justify-center gap-1 text-xs'>
                        <ListChecks className='h-3 w-3' />
                        {cardInfo.checklists}
                    </span>
                )}
            </div>
            <div className='flex items-center justify-end gap-1 mt-3'>
                {cardMembers.map((member) => (
                    <Avatar className='h-7 w-7' key={member._id}>
                        <AvatarImage src={member.avatar} alt={member.username} />
                        <AvatarFallback className='text-xs'>{member.initials}</AvatarFallback>
                    </Avatar>
                ))}
            </div>
        </div>
        /* </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem>Open card</ContextMenuItem>
            <ContextMenuItem>
                <Popover>
                    <PopoverTrigger asChild>Change Members</PopoverTrigger>
                    <PopoverContent>

                    </PopoverContent>
                </Popover>
            </ContextMenuItem>
            <ContextMenuItem>Delete card</ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu> */
    )
}

export default ListCard