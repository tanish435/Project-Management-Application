import React, { useEffect, useState } from 'react'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/utils/ApiResponse';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ChangeCardMembers from './ChangeCardMembers';
import { Ellipsis, List, Paperclip, Plus, SquareCheckBig, Text, Trash2, UserRoundPlus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import CardDescriptionEditor from './CardDescriptionEditor';
import AddAttachmentPopover from './AddAttachmentPopover';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import LinkAttachmentModifyPopover from './LinkAttachmentModifyPopover';
import FileAttachmentModifyPopover from './FileAttachmentModifyPopover';
import { checklistNameSchema } from '@/schemas/checklistSchema';
import { Input } from './ui/input';
import { todoSchema } from '@/schemas/todoSchema';
import { Checkbox } from './ui/checkbox';
import ChangeTodoMembers from './ChangeTodoMembers';
import { Progress } from './ui/progress';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { PopoverClose } from '@radix-ui/react-popover';
import CommentEditor from './CommentEditor';
import { Attachment, Card as C, Checklist, Todo, User, Comment } from '@/types/interface';

interface props {
    cardInfo: C
    boardMembers: User[]
    cardMembers: User[];
    description: string
    setCardMembers: React.Dispatch<React.SetStateAction<User[]>>;
    setDescription: React.Dispatch<React.SetStateAction<string>>;

}

const Card = ({ cardInfo, boardMembers, cardMembers, setCardMembers, description, setDescription }: props) => {
    const slug = cardInfo?.slug
    // const [slug, setSlug] = useState(cardInfo?.slug)
    const [cardData, setCardData] = useState<C | null>();
    const [isEditDescriptionActive, setIsEditDescriptionActive] = useState(false)
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [checklists, setChecklists] = useState<Checklist[]>([])
    const [comments, setComments] = useState<Comment[]>([])
    const [links, setLinks] = useState<Attachment[]>([])
    const [files, setFiles] = useState<Attachment[]>([])

    const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
    const [editedContent, setEditedContent] = useState('')
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [commentToEdit, setCommentToEdit] = useState<Comment | null>(null);
    // const [cardName, setCardName] = useState(cardInfo.name);

    // const [isCardLoading, setIsCardLoading] = useState<boolean>(false)

    const [isAddCommentActive, setIsAddCommentActive] = useState(false)

    const createChecklistForm = useForm<z.infer<typeof checklistNameSchema>>({
        resolver: zodResolver(checklistNameSchema),
        defaultValues: {
            checklistName: ''
        }
    })

    const createTodoForm = useForm<z.infer<typeof todoSchema>>({
        resolver: zodResolver(todoSchema),
        defaultValues: {
            content: ''
        }
    })

    const onSubmit = async (data: z.infer<typeof checklistNameSchema>) => {
        try {
            const response = await axios.post(`/api/checklists/createChecklist/${cardInfo._id}`, {
                name: data.checklistName
            })

            console.log("chklist", response.data)

            if (response.data.success) {
                setChecklists(prev => [...prev, response.data.data])
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to create checklist', {
                description: errMsg
            })
        }
    }

    const onAddTodo = async (data: z.infer<typeof todoSchema>, checklistId: string) => {
        try {
            const response = await axios.post(`/api/todos/createTodo/${cardInfo._id}/${checklistId}`, {
                content: data.content
            })

            if (response.data.success) {
                setChecklists(prev => prev.map(checklist => {
                    if (checklist._id === checklistId) {
                        return {
                            ...checklist,
                            todos: [...checklist.todos, response.data.data]
                        }
                    }

                    return checklist
                }))
                createTodoForm.reset()
                setActiveChecklistId(null)
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to create todo', {
                description: errMsg
            })
        }
    }

    const toggleTodoStatus = async (checklistId: string, todoId: string) => {
        try {
            const response = await axios.patch(`/api/todos/toggleCompleteStatus/${cardInfo._id}/${checklistId}/${todoId}`)

            console.log("toggkle", response.data)

            if (response.data.success) {
                setChecklists(prev => prev.map(checklist => {
                    if (checklist._id === checklistId) {
                        return {
                            ...checklist,
                            todos: checklist.todos.map(todo =>
                                todo._id === todoId ? response.data.data : todo
                            )
                        }
                    }

                    return checklist
                }))
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to toggle todo complete status', {
                description: errMsg
            })
        }
    }

    const handleSaveEditedTodo = async (checklistId: string, todoId: string) => {
        try {
            const response = await axios.patch(`/api/todos/updateTodoContent/${cardInfo._id}/${checklistId}/${todoId}`, {
                content: editedContent
            })

            console.log("updatedd contnet", response.data)

            if (response.data.success) {
                setEditingTodoId(null)
                setEditedContent('')

                setChecklists(prev => prev.map(checklist => {
                    if (checklist._id === checklistId) {
                        return {
                            ...checklist,
                            todos: checklist.todos.map(todo =>
                                todo._id === todoId ? response.data.data : todo
                            )
                        }
                    }

                    return checklist
                }))
                setEditingTodoId(null)
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to update todo content', {
                description: errMsg
            })
        }
    }

    const deleteTodo = async (checklistId: string, todoId: string) => {
        try {
            const response = await axios.delete(`/api/todos/deleteTodo/${cardInfo._id}/${checklistId}/${todoId}`)

            if (response.data.success) {
                setChecklists(prev => prev.map(checklist => {
                    if (checklist._id === checklistId) {
                        return {
                            ...checklist,
                            todos: checklist.todos.filter(todo =>
                                todo._id !== todoId
                            )
                        }
                    }

                    return checklist
                }))
                setEditingTodoId(null)
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to delete todo content', {
                description: errMsg
            })
        }
    }

    const onDragEnd = async (result: any) => {
        const { destination, source, type, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Only handling todos here
        if (type === "todo") {
            const checklistIndex = checklists.findIndex(
                (cl) => cl._id === source.droppableId
            );
            if (checklistIndex === -1) return;

            const checklist = checklists[checklistIndex];
            const todos = Array.from(checklist.todos);

            // Reorder todos
            const [movedTodo] = todos.splice(source.index, 1);
            todos.splice(destination.index, 0, movedTodo);

            // Update local state (optimistic)
            const updatedTodos = todos.map((todo, index) => ({
                ...todo,
                pos: index,
            }));

            const updatedChecklists = [...checklists];
            updatedChecklists[checklistIndex] = {
                ...checklist,
                todos: updatedTodos,
            };

            setChecklists(updatedChecklists);

            // Sync with backend
            try {
                const response = await axios.patch(
                    `/api/todos/updateTodoPos/${cardInfo._id}/${checklist._id}/${draggableId}`,
                    {
                        position: destination.index,
                    }
                );

                if (response.data.success) {
                    toast.success("Todo position updated");
                }
            } catch (err) {
                const axiosErr = err as AxiosError<ApiResponse>;
                console.error("Todo position update error:", axiosErr.response || axiosErr.message);
                toast.error("Failed to update todo position", {
                    description: axiosErr.response?.data.message || "Unknown error",
                });
            }
        }
    };

    const deleteChecklist = async (checklistId: string) => {
        try {
            const response = await axios.delete(`/api/checklists/deleteChecklist/${cardInfo._id}/${checklistId}`)

            console.log("deltetee");


            if (response.data.success) {
                setChecklists(prev => prev.filter(checklist => checklist._id !== checklistId))
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to delete checklist', {
                description: errMsg
            })
        }
    }


    const deleteComment = async (commentId: string) => {
        try {
            const response = await axios.delete(`/api/comments/deleteComment/${cardInfo._id}/${commentId}`)

            console.log("deltetee comment");


            if (response.data.success) {
                setComments(prev => prev.filter(comment => comment._id !== commentId))
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to delete comment', {
                description: errMsg
            })
        }
    }



    useEffect(() => {
        const fetchCardBySlug = async () => {
            try {
                // setIsCardLoading(true)
                const response = await axios.get(`/api/cards/getCardBySlug/${slug}`)
                const card = response.data.data
                setCardData(card);
                setDescription(card.description || '')
                setAttachments(card.attachments)
                setChecklists(card.checklists)
                setComments(card.comments)

            } catch (error) {
                console.log("Error fetching card");
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message

                toast.error('Failed to fetch card info', {
                    description: errMsg
                })
            } 
            // finally {
                // setIsCardLoading(false)
            // }

        }

        fetchCardBySlug()
    }, [])

    const getDownloadUrl = (url: string) => {
        if (url.includes("cloudinary.com") && url.includes("/upload/")) {
            return url.replace("/upload/", "/upload/fl_attachment/");
        }
        return url;
    };

    useEffect(() => {
        const links = attachments.filter(att => att.isWebsiteLink)
        const files = attachments.filter(att => !att.isWebsiteLink)

        setLinks(links)
        setFiles(files)
    }, [attachments, setAttachments])

    useEffect(() => {
        console.log("ere", cardData);
        setCardMembers(cardData?.members as User[])
    }, [cardData])

    return (
        <DialogContent className='h-[600px] max-w-[768px] flex flex-col bg-gray-700'>
            {/* <EditableCardTitle
                cardId={cardInfo._id}
                cardName={cardName}
                onNameUpdate={setCardName}
            /> */}
            <DialogHeader className='flex flex-'>
                <DialogTitle className='text-xl'>
                    {cardInfo.name}
                </DialogTitle>
                <DialogDescription></DialogDescription>
            </DialogHeader>

            <div className='flex flex-col gap-2 overflow-y-auto space-y-5 pr3 scrollbar-hide'>
                <section className='flex gap-2'>
                    <ChangeCardMembers
                        cardId={cardInfo._id}
                        cardMembers={cardMembers}
                        setCardMembers={setCardMembers}
                        boardMembers={boardMembers}
                        trigger={
                            <Button className='bg-gray-700 border-2'>
                                <UserRoundPlus />
                                Members
                            </Button>
                        }
                    />

                    <div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className='bg-gray-700 border-2'>
                                    <SquareCheckBig />
                                    Checklist
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="">
                                <Form {...createChecklistForm}>
                                    <form onSubmit={createChecklistForm.handleSubmit(onSubmit)} className="w-full space-y-6">
                                        <FormField
                                            name="checklistName"
                                            control={createChecklistForm.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Add checklist</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            id="link"
                                                            className='bg-gray-900'
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex gap-2">
                                            <Button type="submit" className='bg-blue-400 hover:bg-[#75b2fb] text-black px-3 py-1.5'>Save</Button>
                                        </div>
                                    </form>
                                </Form>
                            </PopoverContent>
                        </Popover>
                    </div>


                    <AddAttachmentPopover
                        cardId={cardInfo._id}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        trigger={
                            <Button className='bg-gray-700 border-2'>
                                <Paperclip />
                                Attachment
                            </Button>
                        }
                    />

                </section>

                {cardMembers && cardMembers.length > 0 &&
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
                                    trigger={
                                        <Button className='bg-gray-700 h-7 w-7 p-0 hover:bg-gray-600 rounded-full'>
                                            <Plus />
                                        </Button>
                                    }
                                />
                            </span>
                        </div>
                    </section>
                }


                <section className="grid grid-cols-[40px_minmax(0,1fr)] gap-y-3 mb-6 justify-items-stretch content-around">
                    <div className="text-gray-400 flex items-center justify-center">
                        <Text />
                    </div>

                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Description</h3>
                        {!isEditDescriptionActive && description?.length > 0 ?
                            <Button className='bg-gray-600 hover:bg-[#5f6671] py-1.5 font-normal rounded-sm' onClick={() => setIsEditDescriptionActive(true)}>Edit</Button>
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

                {attachments.length > 0 && <section className="grid grid-cols-[40px_minmax(0,1fr)] gap-y-3 mb-6 justify-items-stretch content-around">
                    <div className="text-gray-400 flex items-center justify-center">
                        <Paperclip className='h-5 w-5' />
                    </div>

                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Attachments</h3>
                        <div
                        // className='bg-gray-600 hover:bg-[#5f6671] py-1.5 font-normal rounded-sm'
                        // onClick={() => setIsEditDescriptionActive(true)}
                        >
                            <AddAttachmentPopover
                                cardId={cardInfo._id}
                                attachments={attachments}
                                setAttachments={setAttachments}
                            />
                        </div>
                    </div>

                    {/* Empty cell for alignment */}
                    <div></div>


                    <div>
                        <div>
                            <h3 className='text-xs mb-2'>Links</h3>
                            <ul>
                                {links?.map((link) => (
                                    <li key={link._id}>
                                        <div
                                            className='flex w-full bg-gray-800 p-2 rounded justify-between items-center'
                                        >
                                            <Link href={link.url} target='_blank' className='flex-1'>

                                                <div className='text-sm w-full hover:underline'>{link.name}</div>
                                            </Link>

                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button className='h-7 w-6 bg-gray-700 hover:bg-gray-600 ml-2'><Ellipsis /></Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0">
                                                    <LinkAttachmentModifyPopover
                                                        cardId={cardInfo._id}
                                                        link={link}
                                                        setAttachments={setAttachments}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className='mt-3'>
                            <h3 className='text-xs mb-2'>Files</h3>
                            <ul>
                                {files?.map((file) => (
                                    <li key={file._id}>
                                        <div
                                            className='flex w-full bg-gray-800 p-2 rounded justify-between items-center'
                                        >

                                            <a
                                                href={getDownloadUrl(file.url)}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1"
                                            >

                                                <div className='text-sm w-full hover:underline'>{file.name}</div>
                                            </a>

                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button className='h-7 w-6 bg-gray-700 hover:bg-gray-600 ml-2'><Ellipsis /></Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0">
                                                    <FileAttachmentModifyPopover
                                                        cardId={cardInfo._id}
                                                        setAttachments={setAttachments}
                                                        file={file}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>}

                {checklists && checklists.map((checklist) => (
                    <section key={checklist._id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-y-3 mb-6 justify-items-stretch content-around">
                        <div className="text-gray-400 flex items-center justify-center">
                            <SquareCheckBig className='h-5 w-5' />
                        </div>

                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">{checklist.name}</h3>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button className="bg-gray-600 hover:bg-[#5f6671] py-1.5 font-normal rounded-sm">
                                        Delete
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="bg-gray-800 w- p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex-1 text-center font-medium text-white">Delete checklist</div>
                                        <PopoverClose asChild>
                                            <Button variant="ghost" className="w-8 hover:bg-gray-700 h-auto">
                                                <X className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </PopoverClose>
                                    </div>

                                    {/* Warning message */}
                                    <p className="text-sm text-gray-300 mb-4">
                                        Deleting a checklist is permanent and there is no way to get it back.
                                    </p>

                                    {/* Delete button */}
                                    <Button
                                        variant="destructive"
                                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-sm"
                                        onClick={() => deleteChecklist(checklist._id)}
                                    >
                                        Delete
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Empty cell for alignment */}
                        <div></div>

                        {/* Checklist Content */}
                        <div>
                            {checklist.todos.length > 0 && (
                                <div className="mb-2">
                                    <Progress
                                        value={
                                            (checklist.todos.filter((todo) => todo.complete).length /
                                                checklist.todos.length) *
                                            100
                                        }
                                        className="h-2 bg-gray-600"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {
                                            checklist.todos.filter((todo) => todo.complete).length
                                        }{" "}
                                        of {checklist.todos.length} completed
                                    </p>
                                </div>
                            )}
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId={checklist._id} type='todo' direction='vertical'>
                                    {(provided) => (
                                        <ul
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className='mb-3'>

                                            {checklist?.todos.map((todo: Todo, index: number) => (
                                                <Draggable key={todo._id} draggableId={todo._id} index={index}>
                                                    {(provided) => (

                                                        <li
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            ref={provided.innerRef}
                                                            className='flex gap-1.5 items-center my-0.5 '>
                                                            <Checkbox
                                                                className='peer bg-gray-900 border-gray-500 data-[state=checked]:bg-blue-400 data-[state=checked]:text-black data-[state=checked]:border-0 rounded-sm'
                                                                checked={todo.complete}
                                                                onCheckedChange={() => toggleTodoStatus(checklist._id, todo._id)}
                                                            />


                                                            <div
                                                                className={`group rounded-lg py-1.5 px-2 text-sm w-full flex justify-between ${editingTodoId !== todo._id ? 'hover:bg-gray-600' : 'bg-transparent'
                                                                    }`}
                                                            >
                                                                <div
                                                                    onClick={() => {
                                                                        setEditingTodoId(todo._id);
                                                                        setEditedContent(todo.content);
                                                                    }}
                                                                    className="w-full"
                                                                >
                                                                    {editingTodoId === todo._id ? (
                                                                        <div className="w-full space-y-2">
                                                                            <Textarea
                                                                                value={editedContent}
                                                                                onChange={(e) => {
                                                                                    setEditedContent(e.target.value)
                                                                                    e.stopPropagation()
                                                                                }}
                                                                                className="resize-y w-full min-h-[40px] bg-gray-800 text-sm text-gray-200"
                                                                                autoFocus
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    onClick={() => handleSaveEditedTodo(checklist._id, todo._id)}
                                                                                    className="rounded-sm bg-blue-500 hover:bg-[#75b2fb] text-black px-3 py-1"
                                                                                >
                                                                                    Save
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    onClick={(e) => {
                                                                                        setEditingTodoId(null)
                                                                                        e.stopPropagation()
                                                                                    }}
                                                                                    className="hover:bg-[#5f6671] px-3 text-gray-300"
                                                                                >
                                                                                    Cancel
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        todo.content
                                                                    )}
                                                                </div>

                                                                {editingTodoId !== todo._id && (
                                                                    <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100">

                                                                        {/* Assign members to todo */}
                                                                        <span className="bg-[#404a57] hover:bg-gray-500 p-1 rounded-full">
                                                                            <ChangeTodoMembers
                                                                                cardId={cardInfo._id}
                                                                                checklistId={checklist._id}
                                                                                todoId={todo._id}
                                                                                todoMembers={todo.assignedTo}
                                                                                cardMembers={cardMembers}
                                                                                setTodoMembers={(updatedMembers: User[]) => {
                                                                                    setChecklists((prev) =>
                                                                                        prev.map((list) =>
                                                                                            list._id === checklist._id
                                                                                                ? {
                                                                                                    ...list,
                                                                                                    todos: list.todos.map((t) =>
                                                                                                        t._id === todo._id ? { ...t, assignedTo: updatedMembers } : t
                                                                                                    ),
                                                                                                }
                                                                                                : list
                                                                                        )
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </span>

                                                                        {/* Delete Todo */}
                                                                        <span
                                                                            onClick={() => deleteTodo(checklist._id, todo._id)}
                                                                            className="bg-[#404a57] hover:bg-gray-500 p-1 rounded-full">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </li>
                                                    )}

                                                </Draggable>
                                            ))}

                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            {activeChecklistId !== checklist._id ? (
                                <Button
                                    className="bg-gray-600 hover:bg-gray-500 hover:text-gray-200 p-2 text-sm rounded-sm text-gray-300"
                                    onClick={() => setActiveChecklistId(checklist._id)}
                                >
                                    Add an item
                                </Button>
                            ) :
                                (
                                    <div className="flex flex-col gap-2">
                                        <Form {...createTodoForm}>
                                            <form onSubmit={createTodoForm.handleSubmit(data => onAddTodo(data, checklist._id))} className="w-full space-y-3">
                                                <FormField
                                                    name="content"
                                                    control={createTodoForm.control}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Add a todo..."
                                                                    className="resize-y w-full min-h-[40px] bg-gray-800 text-sm text-gray-200"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex gap-2">
                                                    <Button type='submit' className="rounded-sm bg-blue-500 hover:bg-[#75b2fb] text-black px-3 py-1">
                                                        Save
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="hover:bg-[#5f6671] px-3 text-gray-300"
                                                        onClick={() => setActiveChecklistId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
                                    </div>
                                )}
                        </div>

                    </section>
                ))}

                <section className="grid grid-cols-[40px_minmax(0,1fr)] gap-y-3 mb-6 justify-items-stretch content-around">
                    <div className="text-gray-400 flex items-center justify-center">
                        <List />
                    </div>

                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Activity</h3>

                    </div>

                    {/* Empty cell for alignment */}
                    <div></div>

                    {/* Comment Content */}
                    <div>
                        {!isAddCommentActive ? (
                            <Button
                                onClick={() => setIsAddCommentActive(true)}
                                className='text-gray-300 bg-slate-800 w-full justify-start'
                            >
                                Write a comment...
                            </Button>
                        ) : (
                            <CommentEditor
                                cardId={cardInfo._id}
                                setComments={setComments}
                                onCancel={() => setIsAddCommentActive(false)}
                                setIsAddCommentActive={setIsAddCommentActive}
                            />
                        )}

                        <ul className='mt-3'>

                            {comments.map((comment => (
                                <li key={comment._id} className="flex gap-3 mb-3 items-start">
                                    <Avatar className='h-7 w-7'>
                                        <AvatarImage src={comment.owner.avatar as string} alt={comment.owner.username} className='' />
                                        <AvatarFallback>{comment.owner.initials}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">

                                        {editingCommentId === comment._id ? (
                                            <CommentEditor
                                                cardId={cardInfo._id}
                                                commentToEdit={commentToEdit}
                                                isEditing={true}
                                                onCancel={() => {
                                                    setEditingCommentId(null)
                                                    setCommentToEdit(null)
                                                }}
                                                setComments={setComments}

                                            />
                                        ) : (
                                            <>
                                                <div className="text-sm text-gray-300 flex flex-wrap gap-2 items-center">
                                                    <span className="font-medium">{comment.owner?.username}</span>
                                                    <span className="text-xs mt-[3px] text-gray-400">
                                                        {new Date(comment.updatedAt).toLocaleString(undefined, {
                                                            dateStyle: "medium",
                                                            timeStyle: "short",
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Comment Text */}
                                                <p className="text-gray-300 bg-slate-800 p-2 rounded-md mt-2 text-sm">{comment.content}</p>

                                                {/* Actions */}
                                                <div className="mt-2 flex gap-3">
                                                    <Button
                                                        variant="link"
                                                        className="text-xs p-0 h-auto text-blue-400"
                                                        onClick={() => {
                                                            setEditingCommentId(comment._id)
                                                            setCommentToEdit(comment)
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="link"
                                                                className="text-xs p-0 h-auto text-red-400"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="bg-gray-800 w- p-4">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <div className="flex-1 text-center font-medium text-white">Delete comment</div>
                                                                <PopoverClose asChild>
                                                                    <Button variant="ghost" className="w-8 hover:bg-gray-700 h-auto">
                                                                        <X className="h-4 w-4 text-gray-400" />
                                                                    </Button>
                                                                </PopoverClose>
                                                            </div>

                                                            {/* Warning message */}
                                                            <p className="text-sm text-gray-300 mb-4">
                                                                Deleting a comment is permanent and there is no way to get it back.
                                                            </p>

                                                            {/* Delete button */}
                                                            <Button
                                                                variant="destructive"
                                                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-sm"
                                                                onClick={() => deleteComment(comment._id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </>
                                        )}


                                    </div>
                                </li>
                            )))}
                        </ul>
                    </div>

                </section>
            </div>
        </DialogContent>
    )
}

export default Card