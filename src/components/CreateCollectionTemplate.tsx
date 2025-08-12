'use client'
import React, { useState } from 'react'
import { Separator } from './ui/separator'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { z } from "zod"
import { Input } from './ui/input'
import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ApiResponse } from '@/utils/ApiResponse'
import { Button } from './ui/button'
import { Check, ChevronLeft, Loader2, Pencil, X } from 'lucide-react'
import { createCollectionSchema } from '@/schemas/collectionSchema'
import { PopoverClose } from '@radix-ui/react-popover'

interface Collection {
    _id: string
    name: string
    boards: string[]
}

interface props {
    board: string
    boardCollections: Collection[]
    collections: Collection[]
    onCollectionCreated: (newCollection: Collection) => void
    onCollectionUpdated: (updatedCollection: Collection) => void
    onCollectionDeleted: (deletedCollection: Collection) => void
    onChangeCollection: (collection: Collection) => void
}

const CreateCollectionTemplate = ({ boardCollections, collections, onCollectionCreated, onCollectionUpdated, onCollectionDeleted, onChangeCollection }: props) => {
    const [collectionNameError, setCollectionNameError] = useState('')
    const [createCollectionActive, setCreateCollectionActive] = useState(collections.length === 0)
    const [creating, setCreating] = useState(false)
    const [isEditActive, setIsEditActive] = useState(false)
    const [collection, setCollection] = useState<Collection | null>()
    const [name, setName] = useState("")

    const form = useForm<z.infer<typeof createCollectionSchema>>({
        defaultValues: {
            name: '',
            boardIds: []
        }
    })

    const toggleCollection = async (collection: Collection) => {
        if (!collection || !collection._id) return;

        try {
            await onChangeCollection(collection);
        } catch (error) {
            console.error("Error toggling collection:", error);
            toast.error("Failed to update collection");
        }
    };

    const onEditClick = (collection: Collection) => {
        setIsEditActive(true)
        setCollection(collection)
        setName(collection.name)
    }

    const updateCollectionName = async (collection: Collection, newName: string) => {
        try {
            const response = await axios.patch(`/api/collections/updateCollection/${collection._id}`,
                { name: newName }
            )

            if (response?.data?.success) {
                const updatedCollection = response.data.data
                onCollectionUpdated(updatedCollection)
                setIsEditActive(false)
            }

            setName("")
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errorMsg = axiosError.response?.data.message
            setCollectionNameError(errorMsg as string)
            toast("Error updating collection name", {
                description: errorMsg
            })
        }
    }

    const deleteCollection = async (collection: Collection) => {
        try {
            const response = await axios.delete(`/api/collections/deleteCollection/${collection._id}`)

            if (response?.data?.success) {
                const deletedCollection = response.data.data
                onCollectionDeleted(deletedCollection)
                setIsEditActive(false)
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errorMsg = axiosError.response?.data.message
            toast("Failed to delete collection", {
                description: errorMsg
            })
        }
    }

    const onCreateBoard = async (data: z.infer<typeof createCollectionSchema>) => {
        try {
            setCreating(true)
            setCollectionNameError('')
            const response = await axios.post(`/api/collections/createCollection`, {
                ...data,
                boardIds: []
            })

            if (response?.data?.success) {
                const newCollection = response.data.data
                onCollectionCreated(newCollection)
                setCreateCollectionActive(false)
            }

            console.log(response)
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errorMsg = axiosError.response?.data.message
            setCollectionNameError(errorMsg as string)
            toast("Error creating board", {
                description: errorMsg
            })
        } finally {
            setCreating(false)
        }

    }

    return (
        <div className='p-5 bg-slate-800 border-slate-700 border-2 rounded-lg'>
            {createCollectionActive ? (
                <div>
                    {/* <div className='text-gray-300 text-sm text-center'>Create Collection</div> */}
                    <div className='flex items-center justify-between mb-3'>
                        <Button
                            variant={'ghost'}
                            onClick={() => setCreateCollectionActive(false)}
                            className='w-8 hover:bg-gray-700 h-auto'
                        >

                            <ChevronLeft className='text-gray-400' />
                        </Button>
                        <div className='flex-1 text-center'>
                            <span className='text-gray-300 text-sm'>Create collection</span>
                        </div>
                        <PopoverClose asChild>
                            <Button
                                variant={'ghost'}
                                className='w-8 hover:bg-gray-700 h-auto'
                            >
                                <X className='h-4 w-4 text-gray-400' />
                            </Button>
                        </PopoverClose>
                    </div>
                    <Separator className='mb-4 mt-2 bg-gray-500' />

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onCreateBoard)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className='text-xs text-gray-300'>Collection Name</FormLabel>
                                        <FormControl>
                                            <Input className='bg-slate-900 mb-2 ring-1' {...field} />
                                        </FormControl>
                                        {collectionNameError && (
                                            <div className='text-xs text-red-500 mt-1'>{collectionNameError}</div>
                                        )}
                                    </FormItem>
                                )}
                            />


                            <Separator />
                            <div className='flex items-center justify-center'>
                                {
                                    creating ?
                                        <Button className='w-full' disabled><Loader2 className='animate-spin' /></Button>
                                        :
                                        <Button className='w-full' type="submit">Create Collection</Button>

                                }
                            </div>
                        </form>
                    </Form>
                </div>
            ) :
                (
                    <>
                        {isEditActive ? (
                            <div>
                                {/* <div className='text-gray-300 text-sm mb-3 text-center'>Edit collection</div> */}
                                <div className='flex items-center justify-between mb-3'>
                                    <Button
                                        variant={'ghost'}
                                        onClick={() => setIsEditActive(false)}
                                        className='w-8 hover:bg-gray-700 h-auto'
                                    >

                                        <ChevronLeft className='text-gray-400' />
                                    </Button>
                                    <div className='flex-1 text-center'>
                                        <span className='text-gray-300 text-sm'>Edit collection</span>
                                    </div>
                                    <PopoverClose asChild>
                                        <Button
                                            variant={'ghost'}
                                            className='w-8 hover:bg-gray-700 h-auto'
                                        >
                                            <X className='h-4 w-4 text-gray-400' />
                                        </Button>
                                    </PopoverClose>
                                </div>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className='bg-slate-900 mb-2 ring-1'
                                />
                                <div className='flex items-center justify-between mt-4'>
                                    <div>
                                        <Button onClick={() => updateCollectionName(collection as Collection, name)}
                                            className='text-sm py-1 px-4'
                                            variant={'secondary'}>
                                            Save
                                        </Button>
                                    </div>
                                    <div>
                                        <Button onClick={() => deleteCollection(collection as Collection)}
                                            className='text-sm py-1 px-4'
                                            variant={'destructive'}>
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* <div className='text-gray-300 text-sm text-center'>Change Collection</div> */}
                                <div className='flex items-center justify-between mb-3'>
                                    <div className='w-8'></div>
                                    <div className='flex-1 text-center'>
                                        <span className='text-gray-300 text-sm'>Change collection</span>
                                    </div>
                                    <PopoverClose asChild>
                                        <Button
                                            variant={'ghost'}
                                            className='w-8 hover:bg-gray-700 h-auto'
                                        >
                                            <X className='h-4 w-4 text-gray-400' />
                                        </Button>
                                    </PopoverClose>
                                </div>
                                {collections.map((collection) => (
                                    <div
                                        key={collection._id}
                                        onClick={() => toggleCollection(collection)}
                                        className='flex items-center justify-between w-full rounded hover:bg-slate-700 p-1 px-3 text-sm'
                                    >
                                        <span className='w-5 flex items-center mt-1'>
                                            {boardCollections?.some((coll) => coll?._id == collection._id) &&
                                                <Check className='h-4 w-4' />
                                            }
                                        </span>
                                        <span className='text-gray-300 w-full ml-2'>{collection?.name}</span>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onEditClick(collection)
                                            }}
                                            className='p-1 h-full bg-transparent shadow-none hover:bg-slate-500 rounded-sm'>
                                            <Pencil className='h-4 w-4 text-gray-400' />
                                        </Button>
                                    </div>
                                ))}
                                <Separator className='mb-4 mt-2 bg-gray-500' />
                                <Button
                                    onClick={() => setCreateCollectionActive(true)}
                                    className='w-full'>Create Collection</Button>
                            </div>
                        )}
                    </>
                )
            }
        </div >
    )
}

export default CreateCollectionTemplate