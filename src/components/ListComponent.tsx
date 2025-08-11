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
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { Input } from './ui/input';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { ApiResponse } from '@/utils/ApiResponse';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import ListCard from './ListCard';
import { useMutation, useStorage } from '@liveblocks/react';
import { LiveList, LiveObject, Lson } from '@liveblocks/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { CardLson, List, ListLson, User } from '@/types/interface';

interface props {
    listInfo: List;
    boardMembers: User[];
}

const ListComponent = ({ listInfo, boardMembers }: props) => {
    const [name, setName] = useState(listInfo?.name);
    const [isEditActive, setIsEditActive] = useState(false);
    const [isAddCardActive, setIsAddCardActive] = useState(false);
    const [cardName, setCardName] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);


    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Mutation to update list name in Liveblocks storage and backend
    const updateListName = useMutation(
        async ({ storage }, listId: string, newName: string) => {
            if (newName.trim() === '') return;

            const lists = storage.get('lists') as LiveList<LiveObject<ListLson>>;
            // const listArray = lists.toArray()
            const list = lists.find((list) => list.get("_id") === listId);
            if (!list) return;

            // Update name in Liveblocks storage
            list.set('name', newName);

            // Sync with backend
            try {
                const response = await axios.patch(`/api/lists/updateListName/${listInfo.board}/${listId}`, {
                    newName,
                });
                if (response?.data?.success) {
                    toast.success('List name updated successfully');
                }
            } catch (error) {
                const axiosErr = error as AxiosError<ApiResponse>;
                console.error("List name update error:", axiosErr.response || axiosErr.message);
                toast.error("Failed to update list name", {
                    description: axiosErr.response?.data.message || "Unknown error",
                });
                // Revert to original name on error
                setName(listInfo.name);
            }
        },
        [listInfo]
    );

    const deleteList = useMutation(
        async ({ storage }, listId: string) => {
            const lists = storage.get('lists') as LiveList<LiveObject<ListLson>>;
            const listIndex = lists.findIndex((list) => list.get("_id") === listId);

            if (listIndex === -1) return;

            // Remove list from Liveblocks storage
            lists.delete(listIndex);

            // Update positions of remaining lists
            lists.toArray().forEach((list, index) => {
                list.set('position', index);
            });

            try {
                // Delete from backend
                const response = await axios.delete(`/api/lists/deleteList/${listInfo.board}/${listId}`);

                if (response?.data?.success) {
                    toast.success('List deleted successfully');
                }
            } catch (error) {
                const axiosErr = error as AxiosError<ApiResponse>;
                console.error("Delete list error:", axiosErr.response || axiosErr.message);
                toast.error("Failed to delete list", {
                    description: axiosErr.response?.data.message || "Unknown error",
                });

                // Note: In a production app, you might want to revert the Liveblocks change
                // if the backend deletion fails, but that would require storing the deleted list data
            }
        },
        [listInfo]
    );

    // Mutation to create a new card in Liveblocks storage and backend
    const createCard = useMutation(
        async ({ storage }, listId: string, cardName: string) => {
            if (cardName.trim() === '') {
                setIsAddCardActive(false);
                setCardName('');
                return;
            }

            const lists = storage.get('lists') as LiveList<LiveObject<ListLson>>;
            const list = lists.find((list) => list.get("_id") === listId);
            if (!list) return;

            const cards = list.get('cards') // as LiveList<LiveObject<CardLson>>;
            const newPosition = cards.length;

            try {
                // Create card in backend
                const response = await axios.post(`/api/cards/createCard`, {
                    name: cardName,
                    position: newPosition,
                    listId,
                });

                if (response?.data?.success) {
                    const cardData = response.data.data;
                    // Add card to Liveblocks storage
                    const newCard = new LiveObject<CardLson>({
                        _id: cardData._id,
                        name: cardData.name,
                        description: cardData.description || '',
                        slug: cardData.slug,
                        list: cardData.list,
                        position: cardData.position,
                        dueDate: cardData.dueDate || null,
                        members: new LiveList([]), // Initialize empty members list
                        comments: cardData.comments || 0,
                        checklists: cardData.checklists || 0,
                        attachments: cardData.attachments || 0,
                    });
                    cards.push(newCard);

                    setIsAddCardActive(false);
                    setCardName('');
                    toast.success('Card created successfully');
                }
            } catch (error) {
                const axiosErr = error as AxiosError<ApiResponse>;
                console.error("Create card error:", axiosErr.response || axiosErr.message);
                toast.error("Failed to create card", {
                    description: axiosErr.response?.data.message || "Unknown error",
                });
            }
        },
        []
    );

    // Sync local name state with Liveblocks storage
    useEffect(() => {
        setName(listInfo.name);
    }, [listInfo]);

    const handleDeleteConfirm = () => {
        deleteList(listInfo._id);
        setShowDeleteDialog(false);
    };

    // Handle click outside to save changes
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                if (isEditActive) {
                    updateListName(listInfo._id, name as string);
                    setIsEditActive(false);
                }

                if (isAddCardActive) {
                    createCard(listInfo._id, cardName);
                    setIsAddCardActive(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditActive, name, isAddCardActive, cardName, updateListName, createCard, listInfo]);

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
                            <div className="flex items-center justify-between pt-2">
                                <div
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-center w-full cursor-grab pt-2"
                                >
                                    <Minus className="text-gray-400 w-4 h-4" />
                                </div>
                                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDeleteDialog(true);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete List</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete the list "{listInfo.name}"?
                                                This action will permanently delete the list and all its cards.
                                                This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteConfirm}
                                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                            >
                                                Delete List
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <CardTitle
                                ref={wrapperRef}
                                className='text-sm text-gray-300 flex items-center justify-between w-full rounded'
                            >
                                {!isEditActive ? (
                                    <span
                                        onClick={() => setIsEditActive(true)}
                                        className='text-gray-300 w-full ml-2 cursor-pointer'>
                                        {name as string}
                                    </span>
                                ) : (
                                    <Input
                                        ref={inputRef}
                                        autoFocus
                                        onChange={(e) => setName(e.target.value)}
                                        value={name as string}
                                        onBlur={() => updateListName(listInfo._id, name as string)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateListName(listInfo._id, name as string);
                                                setIsEditActive(false);
                                            }
                                        }}
                                        className='w-full py-0 px-1 text-gray-300 h-6'
                                    />
                                )}
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
                                        {listInfo.cards.map((card: any, index: number) => (
                                            <ListCard
                                                cardInfo={card}
                                                boardMembers={boardMembers}
                                                key={card._id}
                                            // index={index}
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
                                {!isAddCardActive ? (
                                    <div
                                        className='w-full flex items-center gap-1.5 text-gray-400'
                                        onClick={() => setIsAddCardActive(true)}
                                    >
                                        <Plus className='h-4 w-4' />
                                        <span className='text-sm'>Add a card</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col w-full max-w-sm items-start gap-1 space-x-2">
                                        <Input
                                            className='w-full'
                                            placeholder='Enter card name'
                                            onChange={(e) => setCardName(e.target.value)}
                                            value={cardName}
                                        />
                                        <span className='flex items-start gap-1 !ml-0'>
                                            <Button
                                                onClick={() => createCard(listInfo._id, cardName)}
                                                type="submit"
                                                className='!ml-0'
                                            >
                                                Create
                                            </Button>
                                            <Button
                                                className='p-2 text-sm'
                                                onClick={() => setIsAddCardActive(false)}
                                            >
                                                <X />
                                            </Button>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};

export default ListComponent;