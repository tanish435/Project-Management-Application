import React, { useEffect, useState } from 'react'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/utils/ApiResponse';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ChangeCardMembers from './ChangeCardMembers';
import { Paperclip, Plus, Text } from 'lucide-react';
import { Button } from './ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { descriptionSchema } from '@/schemas/cardSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import CardDescriptionEditor from './CardDescriptionEditor';

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
    members: User[]
    slug: string
}

interface props {
    cardInfo: Card
    boardMembers: User[]
    cardMembers: User[];
    description: string
    setCardMembers: React.Dispatch<React.SetStateAction<User[]>>;
    setDescription: React.Dispatch<React.SetStateAction<string>>;

}

const Card = ({ cardInfo, boardMembers, cardMembers, setCardMembers, description, setDescription }: props) => {
    const [slug, setSlug] = useState(cardInfo?.slug)
    const [cardData, setCardData] = useState<Card | null>();
    const [isEditDescriptionActive, setIsEditDescriptionActive] = useState(false)

    const [isCardLoading, setIsCardLoading] = useState<boolean>(false)

    const form = useForm<z.infer<typeof descriptionSchema>>({
        resolver: zodResolver(descriptionSchema),
        defaultValues: {
            description: description
        }
    })

    useEffect(() => {
        const fetchCardBySlug = async () => {
            try {
                setIsCardLoading(true)
                const response = await axios.get(`/api/cards/getCardBySlug/${slug}`)
                const card = response.data.data
                setCardData(card);
                setDescription(card.description || '')

            } catch (error) {
                console.log("Error fetching card");
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message

                toast.error('Failed to fetch card info', {
                    description: errMsg
                })
            } finally {
                setIsCardLoading(false)
            }

        }

        fetchCardBySlug()
    }, [])


    // useEffect(() => {
    //     console.log("ere", cardData);
    //     setCardMembers(cardData?.members as User[])
    // }, [cardData])

    return (
        <DialogContent className='h-[600px] max-w-[768px] flex flex-col bg-gray-700'>
            <DialogHeader className='flex flex-'>
                <DialogTitle className='text-xl'>
                    {cardInfo.name}
                </DialogTitle>
                <DialogDescription></DialogDescription>
            </DialogHeader>

            <div className='flex flex-col gap-2'>
                <section className='flex flex-col'>
                    <span className='mb-2 text-sm text-gray-400 font-semibold'>Members</span>
                    <div className='flex gap-1'>
                        {cardMembers?.map((member) => (
                            <Avatar className='h-7 w-7' key={member._id}>
                                <AvatarImage src={member.avatar} alt={member.username} />
                                <AvatarFallback className='text-xs'>{member.initials}</AvatarFallback>
                            </Avatar>
                        ))}
                        <span
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className='rounded'
                        >
                            <ChangeCardMembers
                                cardId={cardInfo._id}
                                boardMembers={boardMembers}
                                cardMembers={cardMembers as User[]}
                                setCardMembers={setCardMembers}
                                trigger={<Plus />}
                            />
                        </span>
                    </div>
                </section>


                <section className="grid grid-cols-[40px_minmax(0,1fr)] gap-y-3 mb-6 justify-items-stretch content-around">
                    <div className="text-gray-400 flex items-center justify-center">
                        <Text />
                    </div>

                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Description</h3>
                        {!isEditDescriptionActive && description?.length > 0 ?
                            <Button className='bg-gray-600 hover:bg-[#5f6671] py-1.5 font-normal' onClick={() => setIsEditDescriptionActive(true)}>Edit</Button>
                            :
                            <div></div>
                        }
                    </div>

                    {/* Empty cell for alignment */}
                    <div></div>

                    {/* Description Content */}
                    <div>
                        {isEditDescriptionActive ? (
                            <CardDescriptionEditor
                                cardId={cardInfo._id}
                                currentDescription={description}
                                onDescriptionSaveSuccess={(updated) => {
                                    setDescription(updated)
                                    setIsEditDescriptionActive(false)
                                }}
                                onCancel={() => setIsEditDescriptionActive(false)}
                            />
                        ) : (description?.length > 0 ? (
                            <>
                                <p className="text-sm">{description}</p>

                            </>
                        ) : (
                            <>
                                <Button
                                    className="w-full h-12 bg-gray-600 hover:bg-[#5f6671] items-start justify-start"
                                    variant="secondary"
                                    onClick={() => setIsEditDescriptionActive(true)}
                                >
                                    Add a description...
                                </Button>
                            </>
                        ))}
                    </div>

                </section>
                        
            </div>
        </DialogContent>
    )
}

export default Card