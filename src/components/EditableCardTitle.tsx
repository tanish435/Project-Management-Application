import React, { useState, useRef, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/utils/ApiResponse';
import { toast } from 'sonner';

interface EditableCardTitleProps {
    cardId: string;
    cardName: string;
    onNameUpdate: (newName: string) => void;
}

const EditableCardTitle = ({ cardId, cardName, onNameUpdate }: EditableCardTitleProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(cardName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        setTempName(cardName);
    }, [cardName]);

    const updateCardName = async (newName: string) => {
        if (!newName.trim() || newName === cardName) {
            setTempName(cardName);
            setIsEditing(false);
            return;
        }

        try {
            const response = await axios.patch(`/api/cards/updateCardName/${cardId}`, {
                name: newName.trim()
            });

            if (response.data.success) {
                onNameUpdate(newName.trim());
                toast.success('Card name updated');
                setIsEditing(false);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            const errMsg = axiosError.response?.data.message;
            
            toast.error('Failed to update card name', {
                description: errMsg
            });
            
            setTempName(cardName); // Reset to original name on error
            setIsEditing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateCardName(tempName);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            updateCardName(tempName);
        } else if (e.key === 'Escape') {
            setTempName(cardName);
            setIsEditing(false);
        }
    };

    const handleBlur = () => {
        updateCardName(tempName);
    };

    return (
        <DialogHeader className='flex flex- mt-4'>
            {isEditing ? (
                <form onSubmit={handleSubmit} className="w-full">
                    <Input
                        ref={inputRef}
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className="text-xl font-semibold bg-gray-600 border-gray-500 focus:border-blue-400 px-2 py-1"
                        maxLength={100}
                    />
                </form>
            ) : (
                <DialogTitle 
                    className='text-xl cursor-pointer rounded px-2 py-1 transition-colors'
                    onClick={() => setIsEditing(true)}
                    title="Click to edit card name"
                >
                    {cardName}
                </DialogTitle>
            )}
            <DialogDescription></DialogDescription>
        </DialogHeader>
    );
};

export default EditableCardTitle;