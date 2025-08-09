import Link from 'next/link'
import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from './ui/button'

interface BoardCardProps {
    name: string
    _id: string
    bgColor: string
    isStarred: boolean
    url: string
    onToggleStar?: (boardId: string, currentStarredStatus: boolean) => Promise<boolean>
}

const BoardCardComponent = ({ name, _id, bgColor, isStarred, url, onToggleStar }: BoardCardProps) => {
    const [isToggling, setIsToggling] = useState(false)
    const [currentStarredStatus, setCurrentStarredStatus] = useState(isStarred)

    const handleStarToggle = async (event: React.MouseEvent) => {
        event.preventDefault() // Prevent navigation
        event.stopPropagation()
        
        if (!onToggleStar || isToggling) return
        
        setIsToggling(true)
        
        try {
            const newStarredStatus = await onToggleStar(_id, currentStarredStatus)
            setCurrentStarredStatus(newStarredStatus)
        } catch (error) {
            // Error handling is done in the parent component
            console.log("Error in BoardCardComponent star toggle", error)
        } finally {
            setIsToggling(false)
        }
    }

    // Update local state when prop changes (for synchronization)
    React.useEffect(() => {
        setCurrentStarredStatus(isStarred)
    }, [isStarred])

    return (
        <div className="relative group">
            <Link href={`/b/${url}/${name.trim().toLowerCase().replace(/\s+/g, '-')}`}>
                <div className={`w-48 h-24 px-2 pr-4 py-1 rounded-sm mx-5 mb-6 flex justify-between items-end ${bgColor} hover:brightness-110 transition-all duration-200 cursor-pointer`}>
                    <p className='relative text-white text-sm font-semibold'>
                        {name}
                    </p>
                </div>
            </Link>
            
            {/* Star button positioned absolutely in top-right corner */}
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-6 p-1 h-auto hover:bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={handleStarToggle}
                disabled={isToggling || !onToggleStar}
                title={currentStarredStatus ? "Remove from starred boards" : "Add to starred boards"}
            >
                {currentStarredStatus ? (
                    <Star 
                        fill='yellow' 
                        strokeWidth={0.5} 
                        className={`h-4 w-4 transition-opacity ${isToggling ? 'opacity-50' : ''}`} 
                    />
                ) : (
                    <Star 
                        className={`h-4 w-4 text-white transition-opacity hover:fill-yellow-200 ${isToggling ? 'opacity-50' : ''}`} 
                    />
                )}
            </Button>
        </div>
    )
}

export default BoardCardComponent