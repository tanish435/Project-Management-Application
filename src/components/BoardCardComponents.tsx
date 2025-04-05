import { Star } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

interface BoardCardProps {
    name: string
    url: string
    bgColor: string
    _id: string
    isStarred: boolean
}

const BoardCardComponent = ({ name, url, bgColor, _id, isStarred }: BoardCardProps) => {
    return (
        <div className={`w-48 h-24 px-2 pr-4 py-1 rounded-sm mx-5 mb-6 flex justify-between items-start ${bgColor}`}>
            <Link href={`/b/${url}/${name.trim().toLowerCase().replace(/\s+/g, '-')}`}>
                <p className='relative top-0 left-0 text-white text-md font-bold'>
                    {`${name}`}
                </p>
                {isStarred ?
                    <Star fill='yellow' strokeWidth={'0.5'} className='mt-1 h-4 w-4 relative bottom-0 right-0' />
                    :
                    <Star strokeWidth={'1.6'} color='white' className='mt-1 h-4 w-4 relative bottom-0 right-0' />
                }
            </Link> 
        </div>
    )
}

export default BoardCardComponent