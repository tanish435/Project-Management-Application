import React, { useEffect, useState } from 'react'
import { Badge } from './ui/badge';
import { Ellipsis, ListChecks, MessageSquare, Minus, Paperclip, Text, X } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/utils/ApiResponse';
import { toast } from 'sonner';
import { Draggable } from '@hello-pangea/dnd';
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenuSubTrigger } from '@radix-ui/react-dropdown-menu';
import { Dialog, DialogTrigger } from './ui/dialog';
import CardComp from './Card';
import ChangeCardMembers from './ChangeCardMembers';

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
    list: string
    position: number;
    dueDate: string;
    comments: number;
    checklists: number;
    attachments: number;
    slug: string
    members: User[]
}

interface props {
    cardInfo: Card
    boardMembers: User[]
    isDragging?: boolean;
}

const ListCard = ({ cardInfo, boardMembers, isDragging = false }: props) => {
    const [dueDate, setDueDate] = useState(cardInfo.dueDate)
    const [cardMembers, setCardMembers] = useState<User[]>([])
    const [isCardActive, setIsCardActive] = useState(false)
    const [description, setDescription] = useState(cardInfo.description)

    // const filteredBoardMembers = boardMembers.filter(
    //     (boardMember) => !cardMembers.some((cardMember) => cardMember._id === boardMember._id)
    // );

    const date = new Date(dueDate)
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date)

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

    // useEffect(() => {
    //     console.log("boardMembers", boardMembers);
    // }, [boardMembers]);


    return (
        <>
            <Dialog open={isCardActive} onOpenChange={setIsCardActive} modal={false}>
                <Draggable draggableId={cardInfo._id} index={cardInfo.position}>
                    {(provided) => (
                        // <DialogTrigger asChild>
                        <div
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                            className='w-full bg-gray-800 p-2 pt-1 rounded-md'
                            onClick={(e) => {
                                if (
                                    (e.target as HTMLElement).closest('[data-stop-dialog-open]') === null
                                ) {
                                    setIsCardActive(true)
                                }
                            }}
                        >
                            <div className='flex justify-between w-full'>
                                <div
                                    {...provided.dragHandleProps}
                                    className="w-full flex items-center justify-center cursor-grab"
                                >
                                    <Minus className="text-gray-400 w-4 h-4" />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger data-stop-dialog-open className='bg-gray-800 hover:bg-gray-700 text-xs rounded flex justify-center items-center text-white p-0 h-6 w-6'><Ellipsis className='h-4 w-4' /></DropdownMenuTrigger>

                                    <DropdownMenuContent data-stop-dialog-open className="w-44">
                                        <DropdownMenuSub>
                                            <ChangeCardMembers
                                                cardId={cardInfo._id}
                                                boardMembers={boardMembers}
                                                cardMembers={cardMembers}
                                                setCardMembers={setCardMembers}
                                            />
                                        </DropdownMenuSub>
                                        <DropdownMenuItem>
                                            Delete card
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>


                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-sm ml-[1px]'>{cardInfo.name}</span>
                            </div>
                            <div className='flex flex-wrap gap-2 mt-1'>
                                {dueDate !== null && (
                                    <Badge className='text-gray-400 '>{formattedDate}</Badge>
                                )}
                                {description.trim() !== '' && (
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
                                {cardMembers?.map((member) => (
                                    <Avatar className='h-7 w-7' key={member._id}>
                                        <AvatarImage src={member.avatar} alt={member.username} />
                                        <AvatarFallback className='text-xs'>{member.initials}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                        </div>
                        // </DialogTrigger> 
                    )}
                </Draggable>

                {isCardActive && (
                    <>
                        <div className="fixed inset-0 bg-black/70 z-40 pointer-events-none" />
                        <CardComp
                            cardInfo={cardInfo}
                            boardMembers={boardMembers}
                            cardMembers={cardMembers}
                            setCardMembers={setCardMembers}
                            description={description}
                            setDescription={setDescription}
                        />
                    </>
                )}
            </Dialog>
        </>
    )
}

export default ListCard