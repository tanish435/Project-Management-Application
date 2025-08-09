// hooks/useBoardStarredSync.ts
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/utils/ApiResponse';

interface Board {
    name: string;
    bgColor: string;
    url: string;
    _id: string;
    isStarred: boolean;
}

export const useBoardStarredSync = (boardId?: string) => {
    const [starredBoards, setStarredBoards] = useState<Board[]>([]);
    const [isStarred, setIsStarred] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch starred boards on mount
    useEffect(() => {
        const fetchStarredBoards = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('/api/boards/getStarredBoards');
                setStarredBoards(response.data.data.boards);
            } catch (error) {
                console.log("Error fetching starred boards");
                const axiosError = error as AxiosError<ApiResponse>;
                const errMsg = axiosError.response?.data.message;

                toast.error('Failed to fetch starred boards', {
                    description: errMsg
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStarredBoards();
    }, []);

    // Update isStarred when boardId or starredBoards change
    useEffect(() => {
        if (boardId) {
            const isCurrentBoardStarred = starredBoards?.some(board => board._id === boardId);
            setIsStarred(isCurrentBoardStarred || false);
        }
    }, [starredBoards, boardId]);

    // Listen for synchronization events
    useEffect(() => {
        const handleBoardStarredToggle = (event: CustomEvent) => {
            const { boardId: toggledBoardId, isStarred: newStarredStatus } = event.detail;
            
            // Update starredBoards list
            if (newStarredStatus) {
                // Refetch to get complete board data
                axios.get('/api/boards/getStarredBoards')
                    .then(response => {
                        setStarredBoards(response.data.data.boards);
                    })
                    .catch(error => {
                        console.log("Error syncing starred boards", error);
                    });
            } else {
                setStarredBoards(prev => prev.filter(board => board._id !== toggledBoardId));
            }

            // Update local isStarred state if this is the current board
            if (boardId === toggledBoardId) {
                setIsStarred(newStarredStatus);
            }
        };

        window.addEventListener('boardStarredToggle', handleBoardStarredToggle as EventListener);
        
        return () => {
            window.removeEventListener('boardStarredToggle', handleBoardStarredToggle as EventListener);
        };
    }, [boardId]);

    const toggleStarredStatus = async (targetBoardId: string) => {
        try {
            const response = await axios.patch(`/api/boards/toggleBoardStarredStatus/${targetBoardId}`);
            
            if (response.data.success) {
                const newStarredStatus = response.data.data.isStarred;
                
                // Dispatch custom event for cross-component synchronization
                window.dispatchEvent(new CustomEvent('boardStarredToggle', {
                    detail: { boardId: targetBoardId, isStarred: newStarredStatus }
                }));
                
                toast.success(response.data.message);
                return newStarredStatus;
            }
        } catch (error) {
            console.log("Error toggling starred status", error);
            const axiosError = error as AxiosError<ApiResponse>;
            const errMsg = axiosError.response?.data.message;

            toast.error('Failed to update starred status', {
                description: errMsg
            });
            throw error;
        }
    };

    return {
        starredBoards,
        isStarred,
        isLoading,
        toggleStarredStatus,
        setStarredBoards
    };
};