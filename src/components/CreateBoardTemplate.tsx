'use client'
import React, { useState } from 'react'
import { Separator } from './ui/separator'
import { useForm } from 'react-hook-form'
import { createBoardSchema } from '@/schemas/boardSchema'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { z } from "zod"
import { Input } from './ui/input'
import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ApiResponse } from '@/utils/ApiResponse'
import { Button } from './ui/button'
import { Check, Loader2 } from 'lucide-react'

const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-orange-400', 'bg-yellow-500',
    'bg-green-500', 'bg-teal-400', 'bg-pink-500', 'bg-gray-400'
]

interface Board {
    name: string
    url: string
    bgColor: string
    _id: string
    isStarred: boolean
}

interface CreateBoardTemplateProps {
    onBoardCreated?: (board: Board) => void;
}

const CreateBoardTemplate = ({ onBoardCreated }: CreateBoardTemplateProps) => {
    const [selectedColor, setSelectedColor] = useState('bg-blue-600')
    const [boardNameError, setBoardNameError] = useState('')

    const [creating, setCreating] = useState(false)

    const form = useForm<z.infer<typeof createBoardSchema>>({
        defaultValues: {
            name: '',
            bgColor: 'bg-blue-500'
        }
    })

    const onSubmit = async (data: z.infer<typeof createBoardSchema>) => {
        try {
            setCreating(true)
            setBoardNameError('')
            const response = await axios.post(`/api/boards/createBoard`, {
                ...data,
                bgColor: selectedColor
            })
            console.log(response);
            const createdBoard: Board = response.data.data
            if (onBoardCreated) {
                onBoardCreated(createdBoard)
            }

            toast.success("Board created successfully")
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            let errorMsg = axiosError.response?.data.message
            setBoardNameError(errorMsg as string)
            toast("Error creating board", {
                description: errorMsg
            })
        } finally {
            setCreating(false)
        }

    }

    return (
        <div className='p-5 bg-slate-800 border-slate-700 border-2 rounded-lg'>
            <div className='text-gray-300 text-sm text-center'>Create Board</div>
            <Separator className='mb-4 mt-2 bg-gray-500' />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className='text-xs text-gray-300'>Board name</FormLabel>
                                <FormControl>
                                    <Input className='bg-slate-900 mb-2 ring-1' {...field} />
                                </FormControl>
                                {boardNameError && (
                                    <div className='text-xs text-red-500 mt-1'>{boardNameError}</div>
                                )}
                            </FormItem>
                        )}
                    />

                    <div>
                        <div className='text-gray-300 font-semibold text-xs mb-2'>Choose Background Color</div>
                        <div className="grid grid-cols-4 grid-rows-2 gap-2 ">
                            {colors.map((color) => (
                                <div
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`relative flex items-center justify-center h-8 w-14 rounded cursor-pointer transition-all ${color} ${selectedColor === color ? 'ring-slate-300 ring-2' : ''}`}
                                >
                                    {selectedColor === color &&
                                        <Check className='h-4 w-4 text-black' />
                                    }
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='flex items-center justify-center'>
                        {
                            creating ?
                                <Button className='w-full' disabled><Loader2 className='animate-spin' /></Button>
                                :
                                <Button className='w-full' type="submit">Create Board</Button>

                        }
                    </div>
                </form>
            </Form>
        </div>
    )
}

export default CreateBoardTemplate