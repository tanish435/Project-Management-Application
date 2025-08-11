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
import { useMutation, useStorage } from '@liveblocks/react'
import { LiveList, LiveObject, Lson } from '@liveblocks/client'
import { CardLson, ListLson, User, UserLson } from '@/types/interface'




interface Props {
    cardId: string
    cardMembers: User[]
    setCardMembers: React.Dispatch<React.SetStateAction<User[]>>
    boardMembers: User[]
    trigger?: React.ReactNode // Optional custom trigger
}

const ChangeCardMembers = ({ cardId, cardMembers, setCardMembers, boardMembers, trigger }: Props) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    
    // Get lists from Liveblocks storage
    const lists = useStorage((root) => root.lists as LiveList<LiveObject<ListLson>> | null);
    
    const filteredBoardMembers = boardMembers.filter(
        (boardMember) => !cardMembers?.some((cardMember) => cardMember._id === boardMember._id)
    )

    // Helper function to find and update card in Liveblocks storage
    const updateCardInStorage = useMutation(
        ({ storage }, cardId: string, updateFn: (card: LiveObject<CardLson>) => void) => {
            const liveLists = storage.get('lists') as LiveList<LiveObject<ListLson>>;
            if (!liveLists) return;

            // Find the card across all lists
            for (let i = 0; i < liveLists.length; i++) {
                const list = liveLists.get(i);
                if (!list) continue;

                const cards = list.get('cards') as LiveList<LiveObject<CardLson>>;
                if (!cards) continue;

                for (let j = 0; j < cards.length; j++) {
                    const card = cards.get(j);
                    if (card && card.get('_id') === cardId) {
                        updateFn(card);
                        return;
                    }
                }
            }
        },
        []
    );

    // Update sync timestamp
    const updateSyncTimestamp = useMutation(
        ({ storage }) => {
            storage.set('lastSyncTimestamp', Date.now())
        },
        []
    );

    const addMembersToCard = async (member: User, event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        try {
            // Optimistically update local state
            setCardMembers(prev => [...prev, member]);

            // Update Liveblocks storage
            updateCardInStorage(cardId, (card) => {
                const members = card.get('members') as LiveList<LiveObject<UserLson>>;
                const newMember = new LiveObject<UserLson>({
                    _id: member._id,
                    fullName: member.fullName,
                    username: member.username,
                    email: member.email,
                    avatar: member.avatar,
                    initials: member.initials,
                });
                members.push(newMember);
            });

            // Update backend
            const response = await axios.patch(`/api/cards/addMembersToCard/${cardId}`, {
                memberId: member._id
            });

            if (response?.data?.success) {
                // Update sync timestamp on success
                updateSyncTimestamp();
                toast.success('Member added');
            }
        } catch (error) {
            // Rollback on error
            setCardMembers(prev => prev.filter(m => m._id !== member._id));
            
            // Rollback Liveblocks storage
            updateCardInStorage(cardId, (card) => {
                const members = card.get('members') as LiveList<LiveObject<UserLson>>;
                for (let i = members.length - 1; i >= 0; i--) {
                    const memberObj = members.get(i);
                    if (memberObj && memberObj.get('_id') === member._id) {
                        members.delete(i);
                        break;
                    }
                }
            });

            const axiosError = error as AxiosError<ApiResponse>;
            toast.error('Failed to add member', {
                description: axiosError.response?.data.message
            });
        }
    };

    const removeMembersFromCard = async (memberId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        // Store the member being removed for potential rollback
        const memberToRemove = cardMembers.find(m => m._id === memberId);
        if (!memberToRemove) return;

        try {
            // Optimistically update local state
            setCardMembers(prev => prev.filter(member => member._id !== memberId));

            // Update Liveblocks storage
            updateCardInStorage(cardId, (card) => {
                const members = card.get('members') as LiveList<LiveObject<UserLson>>;
                for (let i = members.length - 1; i >= 0; i--) {
                    const memberObj = members.get(i);
                    if (memberObj && memberObj.get('_id') === memberId) {
                        members.delete(i);
                        break;
                    }
                }
            });

            // Update backend
            const response = await axios.patch(`/api/cards/removeCardMembers/${cardId}`, {
                memberId
            });

            if (response?.data?.success) {
                // Update sync timestamp on success
                updateSyncTimestamp();
                toast.success('Member removed');
            }
        } catch (error) {
            // Rollback on error
            setCardMembers(prev => [...prev, memberToRemove]);
            
            // Rollback Liveblocks storage
            updateCardInStorage(cardId, (card) => {
                const members = card.get('members') as LiveList<LiveObject<UserLson>>;
                const restoredMember = new LiveObject<UserLson>({
                    _id: memberToRemove._id,
                    fullName: memberToRemove.fullName,
                    username: memberToRemove.username,
                    email: memberToRemove.email,
                    avatar: memberToRemove.avatar,
                    initials: memberToRemove.initials,
                });
                members.push(restoredMember);
            });

            const axiosError = error as AxiosError<ApiResponse>;
            toast.error('Failed to remove member', {
                description: axiosError.response?.data.message
            });
        }
    };

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button 
                        className="h-8 w-full rounded bg-transparent px-2 shadow-none justify-start" 
                        data-stop-dialog-open
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPopoverOpen(!isPopoverOpen);
                        }}
                    >
                        <span className='text-sm font-light w-full flex justify-start'>Change Members</span>
                    </Button>
                )}
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