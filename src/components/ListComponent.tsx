'use client'
import React, { useEffect, useRef, useState } from 'react'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from './ui/button';
import {Minus, Plus, X } from 'lucide-react';
import { Input } from './ui/input';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { ApiResponse } from '@/utils/ApiResponse';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import ListCard from './ListCard';

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
    slug: string
    description: string;
    position: number;
    dueDate: string;
    comments: number;
    checklists: number;
    list: string;
    attachments: number;
}

interface List {
    _id: string;
    name: string;
    position: number;
    board: string;
    createdAt: string;
    updatedAt: string;
    createdBy: User[];
    cards: Card[];
}

interface props {
    listInfo: List
    boardMembers: User[]
}

const ListComponent = ({ listInfo, boardMembers }: props) => {
    const [cards, setCards] = useState<Card[]>(listInfo.cards)
    const [name, setName] = useState(listInfo.name)
    const [board, setBoard] = useState(listInfo.board)
    const [position, setPosition] = useState(listInfo.position)
    const [isEditActive, setIsEditActive] = useState(false)
    const [isAddCardActive, setIsAddCardActive] = useState(false)
    const [cardName, setCardName] = useState('')

    const inputRef = useRef<HTMLInputElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        console.log("board info", board);
        console.log("list cards", cards);
    }, [board, cards])



    const saveName = async () => {
        if (name.trim() === '') {
            setName(listInfo.name)
            setIsEditActive(false)
            return;
        }

        try {
            const response = await axios.patch(`/api/lists/updateListName/${listInfo.board}/${listInfo._id}`, {
                newName: name
            })

            if (response?.data?.success) {
                toast.success('List name updated successfully')
            }
        } catch (error) {
            const axiosErr = error as AxiosError<ApiResponse>;
            console.error("List name update error:", axiosErr.response || axiosErr.message);
            toast.error("Failed to update list name", {
                description: axiosErr.response?.data.message || "Unknown error",
            });
            setName(listInfo.name)
        }
    }

    const createCard = async () => {
        if (cardName.trim() === '') {
            setCardName('')
            setIsAddCardActive(false)
            return;
        }

        try {
            const response = await axios.post(`/api/cards/createCard`, {
                name: cardName,
                position: cards.length,
                listId: listInfo._id,
            })

            if (response?.data?.success) {
                setCards((prevCards) => [...prevCards, response.data.data])
                setIsAddCardActive(false)
                setCardName('')
                toast.success('Card created successfully')
            }
        } catch (error) {
            const axiosErr = error as AxiosError<ApiResponse>;
            console.error("Create card error:", axiosErr.response || axiosErr.message);
            toast.error("Failed to create card", {
                description: axiosErr.response?.data.message || "Unknown error",
            });
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                if (isEditActive) {
                    saveName()
                    setIsEditActive(false)
                }

                if (isAddCardActive) {
                    createCard()
                    setIsAddCardActive(false)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isEditActive, name, isAddCardActive, cardName])

    return (
        <Draggable draggableId={listInfo._id} index={listInfo.position}>
            {(provided) => (
                <div 
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                    className='w-max'
                >
                    <Card className='w-[272px]'>
                        <CardHeader className='pt-0 pb-2 px-4'>
                            <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-center cursor-grab pt-2"
                            >
                                <Minus className="text-gray-400 w-4 h-4" />
                            </div>
                            <CardTitle
                                ref={wrapperRef}
                                className='text-sm text-gray-300 flex items-center justify-between w-full rounded'
                            >
                                {!isEditActive ? (
                                    <span
                                        onClick={() => setIsEditActive(true)}
                                        className='text-gray-300 w-full ml-2 cursor-pointer'>
                                        {name}
                                    </span>)
                                    :
                                    <Input
                                        ref={inputRef}
                                        autoFocus
                                        onChange={(e) => setName(e.target.value)}
                                        value={name}
                                        onBlur={saveName}
                                        onKeyDown={(e) => {
                                            if (e.key == 'Enter') {
                                                saveName()
                                                setIsEditActive(false)
                                            }
                                        }}
                                        className='w-full py-0 px-1 text-gray-300 h-6'
                                    />
                                }
                                {/* <Button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEditClick()
                                    }}
                                    className='p-1 h-full bg-transparent shadow-none hover:bg-slate-500 rounded-sm'>
                                    <Pencil className='h-4 w-4 text-gray-400' />
                                </Button> */}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='px-3'>
                            <Droppable droppableId={listInfo._id} type='card' direction='vertical'>
                                {(provided) => (
                                    <div 
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className='flex flex-col gap-2'
                                    >
                                        <span className='h-0.5'></span>
                                        {listInfo.cards.length > 0 && listInfo.cards.map((card) => (
                                            <ListCard
                                            cardInfo={card}
                                            boardMembers={boardMembers}
                                            key={card._id}
                                            />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </CardContent>
                        <CardFooter
                            className='px-3'
                            ref={wrapperRef}
                        >
                            <div className='w-full flex items-center gap-1.5 text-gray-400'>
                                {!isAddCardActive ?
                                    (
                                        <div
                                            className='w-full flex items-center gap-1.5 text-gray-400'
                                            onClick={() => setIsAddCardActive(true)}>
                                            <Plus className='h-4 w-4' />
                                            <span className='text-sm'>Add a card</span>
                                        </div>
                                    )
                                    :
                                    (
                                        <div className="flex flex-col w-full max-w-sm items-start gap-1 space-x-2">
                                            <Input
                                                className='w-full'
                                                placeholder='Enter card name'
                                                onChange={(e) => setCardName(e.target.value)}
                                            />
                                            <span className='flex items-start gap-1 !ml-0'>
                                                <Button
                                                    onClick={() => createCard()}
                                                    type="submit"
                                                    className='!ml-0'
                                                >
                                                    Create
                                                </Button>
                                                <Button
                                                    className='p-2 text-sm'
                                                    onClick={() => setIsAddCardActive(false)}>
                                                    <X />
                                                </Button>
                                            </span>
                                        </div>
                                    )
                                }
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </Draggable>
    )
}

export default ListComponent