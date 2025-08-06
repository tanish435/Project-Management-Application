import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X } from 'lucide-react';
import { useMutation } from '@liveblocks/react';
import { LiveList, LiveObject } from '@liveblocks/client';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/utils/ApiResponse';
import { toast } from 'sonner';

interface User {
    _id: string;
    fullName: string;
    username: string;
    email: string;
    avatar: string;
    initials: string;
}

interface UserLson {
    _id: string;
    fullName: string;
    username: string;
    email: string;
    avatar: string;
    initials: string;
    [key: string]: any;
}

interface CardLson {
    _id: string;
    name: string;
    description: string;
    slug: string;
    list: string;
    position: number;
    dueDate: string;
    members: LiveList<LiveObject<UserLson>>;
    comments: number;
    checklists: number;
    attachments: number;
    [key: string]: any;
}

interface ListLson {
    _id: string;
    name: string;
    position: number;
    board: string;
    createdAt: string;
    updatedAt: string;
    createdBy: LiveList<LiveObject<UserLson>>;
    cards: LiveList<LiveObject<CardLson>>;
    [key: string]: any;
}

interface CreateListButtonProps {
    boardId: string;
    currentUser?: User;
}

const CreateListButton: React.FC<CreateListButtonProps> = ({ boardId, currentUser }) => {
    const [isActive, setIsActive] = useState(false);
    const [listName, setListName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const createList = useMutation(
        async ({ storage }, listName: string) => {
            if (listName.trim() === '') {
                setIsActive(false);
                setListName('');
                return;
            }

            setIsCreating(true);

            const lists = storage.get('lists') as LiveList<LiveObject<ListLson>>;
            const newPosition = lists.length;

            try {
                // Create list in backend first
                const response = await axios.post(`/api/lists/createList`, {
                    name: listName.trim(),
                    position: newPosition,
                    boardId,
                });

                if (response?.data?.success) {
                    const listData = response.data.data;
                    
                    // Add list to Liveblocks storage
                    const newList = new LiveObject<ListLson>({
                        _id: listData._id,
                        name: listData.name,
                        position: listData.position,
                        board: listData.board,
                        createdAt: listData.createdAt,
                        updatedAt: listData.updatedAt,
                        createdBy: new LiveList(
                            currentUser ? [new LiveObject<UserLson>({
                                _id: currentUser._id,
                                fullName: currentUser.fullName,
                                username: currentUser.username,
                                email: currentUser.email,
                                avatar: currentUser.avatar,
                                initials: currentUser.initials,
                            })] : []
                        ),
                        cards: new LiveList([]), // Initialize empty cards list
                    });

                    lists.push(newList);

                    setIsActive(false);
                    setListName('');
                    toast.success('List created successfully');
                }
            } catch (error) {
                const axiosErr = error as AxiosError<ApiResponse>;
                console.error("Create list error:", axiosErr.response || axiosErr.message);
                toast.error("Failed to create list", {
                    description: axiosErr.response?.data.message || "Unknown error",
                });
            } finally {
                setIsCreating(false);
            }
        },
        [boardId, currentUser]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createList(listName);
    };

    const handleCancel = () => {
        setIsActive(false);
        setListName('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isActive) {
        return (
            <div className="w-72 min-w-72 bg-gray-800 rounded-lg p-3 h-fit">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter list title..."
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        autoFocus
                        disabled={isCreating}
                    />
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isCreating || listName.trim() === ''}
                        >
                            {isCreating ? 'Creating...' : 'Add list'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                            disabled={isCreating}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <Button
            onClick={() => setIsActive(true)}
            // variant="ghost"
            className="w-72 min-w-72 h-fit bg-white/20 hover:bg-white/30 text-white hover:text-white flex items-center justify-center gap-2 p-3 rounded-lg transition-colors"
        >
            <Plus className="h-4 w-4" />
            Add another list
        </Button>
    );
};

export default CreateListButton;