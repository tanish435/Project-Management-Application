'use client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserRoundPlus, X } from 'lucide-react'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/utils/ApiResponse'
import { toast } from 'sonner'
import { useState } from 'react'
import { User } from '@/types/interface'

interface Props {
    cardId: string
    checklistId: string
    todoId: string
    todoMembers: User[]
    setTodoMembers: (updated: User[]) => void
    cardMembers: User[]
}

const ChangeTodoMembers = ({
    cardId,
    checklistId,
    todoId,
    todoMembers,
    setTodoMembers,
    cardMembers,
}: Props) => {

    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const filteredCardMembers = cardMembers?.filter(
        (member) => !todoMembers.some((todoMember) => todoMember._id === member._id)
    )

    const addMemberToTodo = async (member: User, event: React.MouseEvent) => {
        event.stopPropagation()
        event.preventDefault()

        try {
            const response = await axios.patch(`/api/todos/assignTodo/${cardId}/${checklistId}/${todoId}`, {
                memberId: member._id,
            })            

            if (response?.data?.success) {
                // setTodoMembers(prev => [...prev, member])

                const updated = [...todoMembers, member];
                setTodoMembers(updated);



                toast.success('Member added')
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            toast.error('Failed to add member', {
                description: axiosError.response?.data.message,
            })
        }
    }

    const removeMemberFromTodo = async (memberId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        event.preventDefault()

        try {
            const response = await axios.patch(`/api/todos/removeAssignedMember/${cardId}/${checklistId}/${todoId}`, {
                memberId,
            })

            if (response?.data?.success) {
                // setTodoMembers(prev => prev.filter(member => member._id !== memberId))

                const updated = todoMembers.filter(m => m._id !== memberId);
                setTodoMembers(updated);

                toast.success('Member removed')
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            toast.error('Failed to remove member', {
                description: axiosError.response?.data.message,
            })
        }
    }

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <span
                    // className="rounded-full hover:bg-transparent bg-transparent shadow-none justify-start"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsPopoverOpen(true)
                    }}
                >
                    <UserRoundPlus className="h-4 w-4" />
                </span>
            </PopoverTrigger>

            <PopoverContent
                className="w-64 z-[9999] pointer-events-auto"
                align="start"
                side="right"
                sideOffset={8}
                avoidCollisions={true}
                onPointerDownOutside={(e) => {
                    const target = e.target as Element
                    if (target.closest('[data-radix-dropdown-menu-content]')) {
                        e.preventDefault()
                    }
                }}
                onInteractOutside={(e) => {
                    const target = e.target as Element
                    if (target.closest('[data-radix-dropdown-menu-content]')) {
                        e.preventDefault()
                    }
                }}
            >
                <div>
                    {todoMembers?.length > 0 && (
                        <>
                            <p className="text-xs text-muted-foreground mb-1">Todo Members</p>
                            {todoMembers?.map((member) => (
                                <div
                                    key={member._id}
                                    onClick={(e) => removeMemberFromTodo(member._id, e)}
                                    className="mb-1 flex items-center justify-between cursor-pointer hover:bg-muted rounded p-1"
                                >
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

                    {filteredCardMembers?.length > 0 && (
                        <>
                            <p className="text-xs text-muted-foreground mt-2 mb-1">Available Members</p>
                            {filteredCardMembers?.map((member) => (
                                <div
                                    key={member._id}
                                    onClick={(e) => addMemberToTodo(member, e)}
                                    className="mb-1 flex items-center gap-2 cursor-pointer hover:bg-muted rounded p-1"
                                >
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

export default ChangeTodoMembers
