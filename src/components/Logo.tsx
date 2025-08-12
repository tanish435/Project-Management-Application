'use client'
import Image from 'next/image';
import LogoImg from '../../public/Logo.png'
import React from 'react'

interface LogoProps {
  className?: string;
}

const Logo = ({className}: LogoProps) => {
  return (
    <div className={`w-36 ${className}`}>
        <Image alt='Workboard' src={LogoImg} />
    </div>
  )
}

export default Logo