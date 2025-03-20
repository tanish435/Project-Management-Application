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



// 'use client'
// import React from 'react'

// interface LogoProps {
//   className?: string;
//   width?: string | number;
//   height?: string | number;
// }

// const Logo: React.FC<LogoProps> = ({ className = '', width = '200', height = '150' }) => {
//     return (
//         <div className={`text-slate-300 ${className}`}>
//             <svg 
//                 xmlns="http://www.w3.org/2000/svg" 
//                 id="svg229219" 
//                 viewBox="0 0 1024 768" 
//                 height={height} 
//                 width={width} 
//                 version="1.1"
//             >
//                 <metadata id="metadata229225"></metadata>
//                 <defs id="defs229223"></defs>
//                 <linearGradient spreadMethod="pad" y2="30%" x2="-10%" y1="120%" x1="30%" id="3d_gradient2-logo-534121e5-f275-4b50-b20d-6d292b0bb8b5">
//                     <stop id="stop229200" stopOpacity="1" stopColor="#ffffff" offset="0%"></stop>
//                     <stop id="stop229202" stopOpacity="1" stopColor="#000000" offset="100%"></stop>
//                 </linearGradient>
//                 <linearGradient gradientTransform="rotate(-30)" spreadMethod="pad" y2="30%" x2="-10%" y1="120%" x1="30%" id="3d_gradient3-logo-534121e5-f275-4b50-b20d-6d292b0bb8b5">
//                     <stop id="stop229205" stopOpacity="1" stopColor="#ffffff" offset="0%"></stop>
//                     <stop id="stop229207" stopOpacity="1" stopColor="#cccccc" offset="50%"></stop>
//                     <stop id="stop229209" stopOpacity="1" stopColor="#000000" offset="100%"></stop>
//                 </linearGradient>
//                 <g id="logo-group">
//                     <image xlinkHref="" id="container" x="272" y="144" width="480" height="480" style={{ display: "none" }} transform="translate(0 0)"></image>
//                     <g id="logo-center" transform="translate(16.29075000000006 0)">
//                         <image xlinkHref="" id="icon_container" x="0" y="0" style={{ display: "none" }}></image>
//                         <g
//                             id="slogan"
//                             style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "32px",
//                                 lineHeight: "1",
//                                 fontFamily: "'Montserrat Light Alt1'",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }}
//                             transform="translate(0 0)"
//                         ></g>
//                         <g
//                             id="title"
//                             style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: "1",
//                                 fontFamily: "'Montserrat Light Alt1'",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle"
//                             }}
//                             transform="translate(0 0)">
//                             <path id="path229228" style={{ fontStyle: "normal", fontWeight: 300, fontSize: "72px", lineHeight: 1, fontFamily: "'Montserrat Light Alt1'", fontVariantLigatures: "none", textAlign: "center", textAnchor: "middle" }} d="m 330.05881,-50.4 h -3.6 l -15.48,45.432 -15.696,-45.432 h -3.528 l -15.768,45.36 -15.336,-45.36 h -3.888 l 17.136,50.4 h 3.888 l 15.696,-45.216 15.624,45.216 h 3.888 z" strokeWidth="0" strokeLinejoin="miter" strokeMiterlimit="2" fill="#a2b5e2" stroke="#a2b5e2" transform="translate(0 327.34) translate(50 12.559999999999995) scale(1.75) translate(-256.76281 50.4)"></path>
//                             <path id="path229230" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: 1,
//                                 fontFamily: "'Montserrat Light Alt1'",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="m 348.14319,-2.952 c 3.96,2.232 8.424,3.312 13.392,3.312 4.896,0 9.36,-1.08 13.392,-3.312 3.96,-2.16 7.056,-5.256 9.36,-9.144 2.304,-3.888 3.456,-8.208 3.456,-13.104 0,-4.824 -1.152,-9.216 -3.456,-13.104 -2.304,-3.888 -5.4,-6.912 -9.36,-9.144 -4.032,-2.16 -8.496,-3.312 -13.392,-3.312 -4.968,0 -9.432,1.152 -13.392,3.384 -4.032,2.232 -7.128,5.256 -9.432,9.144 -2.304,3.888 -3.384,8.28 -3.384,13.032 0,4.824 1.08,9.144 3.384,13.032 2.304,3.888 5.4,6.984 9.432,9.216 z m 24.84,-2.952 c -3.456,1.944 -7.272,2.88 -11.448,2.88 -4.248,0 -8.064,-0.936 -11.52,-2.88 -3.456,-1.872 -6.12,-4.536 -8.064,-7.92 -2.016,-3.384 -2.952,-7.2 -2.952,-11.376 0,-4.176 0.936,-7.92 2.952,-11.304 1.944,-3.384 4.608,-6.048 8.064,-7.992 3.456,-1.872 7.272,-2.88 11.52,-2.88 4.176,0 7.992,1.008 11.448,2.88 3.384,1.944 6.048,4.608 8.064,7.992 1.944,3.384 2.952,7.128 2.952,11.304 0,4.176 -1.008,7.992 -2.952,11.376 -2.016,3.384 -4.68,6.048 -8.064,7.92 z" strokeWidth="0" strokeLinejoin="miter" strokeMiterlimit="2" fill="#acbce4" stroke="#acbce4" transform="translate(0 327.34) translate(187.48766499999996 11.93) scale(1.75) translate(-335.32719 50.76)"></path>
//                             <path id="path229232" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: 1,
//                                 fontFamily: "'Montserrat Light Alt1', sans-serif",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="m 427.04731,-17.64 c 3.744,-1.08 6.696,-2.952 8.712,-5.688 2.016,-2.736 3.096,-6.048 3.096,-10.08 0,-5.256 -1.8,-9.432 -5.4,-12.456 -3.6,-3.024 -8.568,-4.536 -14.904,-4.536 h -18.072 v 3.312 h 18.072 c 5.328,0 9.432,1.224 12.312,3.6 2.808,2.376 4.248,5.76 4.248,10.08 0,4.392 -1.44,7.776 -4.248,10.152 -2.88,2.376 -6.984,3.528 -12.312,3.528 h -18.072 V 0 h 3.672 v -16.488 h 14.4 c 1.44,0 3.096,-0.072 4.896,-0.36 L 435.47131,0 h 4.176 z" strokeWidth="0" strokeLinejoin="miter" strokeMiterlimit="2" fill="#b6c2e6" stroke="#b6c2e6" transform="translate(0 327.34) translate(301.503875 12.559999999999995) scale(1.75) translate(-400.47931 50.4)"></path>
//                             <path id="path229234" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: 1,
//                                 fontFamily: "'Montserrat Light Alt1', sans-serif",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="M 467.34594,-24.84 489.01794,0 h 4.464 l -23.688,-27.504 22.176,-22.896 h -4.464 l -31.464,32.4 v -32.4 h -3.672 V 0 h 3.672 v -13.248 z" strokeWidth="0" strokeLinejoin="miter" strokeMiterlimit="2" fill="#c0c9e8" stroke="#c0c9e8" transform="translate(0 327.34) translate(392.31247749999994 12.559999999999995) scale(1.75) translate(-452.36994 50.4)"></path>
//                             <path id="path229236" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: "1",
//                                 fontFamily: "'Montserrat Light Alt1', sans-serif",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="m 541.15494,-21.744 c -1.872,-2.16 -4.608,-3.528 -8.208,-4.248 2.52,-0.792 4.608,-2.232 6.12,-4.248 1.512,-1.944 2.304,-4.32 2.304,-7.272 0,-4.104 -1.584,-7.272 -4.608,-9.504 -3.024,-2.232 -7.272,-3.384 -12.744,-3.384 h -21.024 v 3.168 h 20.88 c 4.392,0 7.776,0.864 10.152,2.592 2.376,1.728 3.6,4.176 3.6,7.416 0,3.312 -1.224,5.832 -3.6,7.56 -2.376,1.728 -5.76,2.52 -10.152,2.52 h -20.88 v 3.168 h 22.464 c 4.824,0 8.568,0.864 11.088,2.52 2.52,1.728 3.816,4.32 3.816,7.848 0,3.6 -1.296,6.192 -3.816,7.92 -2.52,1.728 -6.192,2.52 -11.088,2.52 h -22.464 V 0 h 22.464 c 6.12,0 10.728,-1.152 13.896,-3.456 3.096,-2.304 4.68,-5.544 4.68,-9.864 0,-3.384 -1.008,-6.192 -2.88,-8.424 z" strokeWidth="0" strokeLinejoin="miter" strokeMiterlimit="2" fill="#cbd0eb" stroke="#cbd0eb" transform="translate(0 327.34) translate(480.9062274999999 12.559999999999995) scale(1.75) translate(-502.99494 50.4)"></path>
//                             <path id="path229238" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: "1",
//                                 fontFamily: "'Montserrat Light Alt1', sans-serif",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="m 565.12756,-2.952 c 3.96,2.232 8.424,3.312 13.392,3.312 4.896,0 9.36,-1.08 13.392,-3.312 3.96,-2.16 7.056,-5.256 9.36,-9.144 2.304,-3.888 3.456,-8.208 3.456,-13.104 0,-4.824 -1.152,-9.216 -3.456,-13.104 -2.304,-3.888 -5.4,-6.912 -9.36,-9.144 -4.032,-2.16 -8.496,-3.312 -13.392,-3.312 -4.968,0 -9.432,1.152 -13.392,3.384 -4.032,2.232 -7.128,5.256 -9.432,9.144 -2.304,3.888 -3.384,8.28 -3.384,13.032 0,4.824 1.08,9.144 3.384,13.032 2.304,3.888 5.4,6.984 9.432,9.216 z m 24.84,-2.952 c -3.456,1.944 -7.272,2.88 -11.448,2.88 -4.248,0 -8.064,-0.936 -11.52,-2.88 -3.456,-1.872 -6.12,-4.536 -8.064,-7.92 -2.016,-3.384 -2.952,-7.2 -2.952,-11.376 0,-4.176 0.936,-7.92 2.952,-11.304 1.944,-3.384 4.608,-6.048 8.064,-7.992 3.456,-1.872 7.272,-2.88 11.52,-2.88 4.176,0 7.992,1.008 11.448,2.88 3.384,1.944 6.048,4.608 8.064,7.992 1.944,3.384 2.952,7.128 2.952,11.304 0,4.176 -1.008,7.992 -2.952,11.376 -2.016,3.384 -4.68,6.048 -8.064,7.92 z" stroke-width="0" stroke-linejoin="miter" stroke-miterlimit="2" fill="#d5d6ed" stroke="#d5d6ed" transform="translate(0 327.34) translate(567.2103124999998 11.93) scale(1.75) translate(-552.31156 50.76)"></path>
//                             <path id="path229240" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: "1",
//                                 fontFamily: "'Montserrat Light Alt1', sans-serif",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="m 635.19256,-50.4 h -3.672 L 608.33656,0 h 3.96 l 21.024,-46.368 21.096,46.368 h 3.96 z" stroke-width="0" stroke-linejoin="miter" stroke-miterlimit="2" fill="#dfddef" stroke="#dfddef" transform="translate(0 327.34) translate(665.2540624999996 12.559999999999995) scale(1.75) translate(-608.33656 50.4)"></path>
//                             <path id="path229242" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: "1",
//                                 fontFamily: "'Montserrat Light Alt1', sans-serif",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="m 694.09419,-17.64 c 3.744,-1.08 6.696,-2.952 8.712,-5.688 2.016,-2.736 3.096,-6.048 3.096,-10.08 0,-5.256 -1.8,-9.432 -5.4,-12.456 -3.6,-3.024 -8.568,-4.536 -14.904,-4.536 h -18.072 v 3.312 h 18.072 c 5.328,0 9.432,1.224 12.312,3.6 2.808,2.376 4.248,5.76 4.248,10.08 0,4.392 -1.44,7.776 -4.248,10.152 -2.88,2.376 -6.984,3.528 -12.312,3.528 h -18.072 V 0 h 3.672 v -16.488 h 14.4 c 1.44,0 3.096,-0.072 4.896,-0.36 L 702.51819,0 h 4.176 z" stroke-width="0" stroke-linejoin="miter" stroke-miterlimit="2" fill="#e9e3f1" stroke="#e9e3f1" transform="translate(0 327.34) translate(768.8359149999999 12.559999999999995) scale(1.75) translate(-667.52619 50.4)"></path>
//                             <path id="path229244" style={{
//                                 fontStyle: "normal",
//                                 fontWeight: 300,
//                                 fontSize: "72px",
//                                 lineHeight: "1",
//                                 fontFamily: "'Montserrat Light Alt1', sans-serif",
//                                 fontVariantLigatures: "none",
//                                 textAlign: "center",
//                                 textAnchor: "middle",
//                             }} d="m 762.76081,-38.16 c -2.304,-3.816 -5.472,-6.768 -9.504,-9 -4.032,-2.16 -8.712,-3.24 -13.896,-3.24 h -19.944 v 3.312 h 19.656 c 4.608,0 8.712,0.936 12.312,2.808 3.528,1.872 6.264,4.464 8.208,7.704 1.872,3.312 2.88,7.128 2.88,11.376 0,4.32 -1.008,8.064 -2.88,11.376 -1.944,3.312 -4.68,5.904 -8.208,7.776 -3.6,1.872 -7.704,2.736 -12.312,2.736 h -15.984 V -25.2 h -3.672 V 0 h 19.944 c 5.184,0 9.864,-1.08 13.896,-3.24 4.032,-2.16 7.2,-5.112 9.504,-8.928 2.232,-3.816 3.384,-8.136 3.384,-13.032 0,-4.824 -1.152,-9.144 -3.384,-12.96 z" stroke-width="0" stroke-linejoin="miter" stroke-miterlimit="2" fill="#f3eaf3" stroke="#f3eaf3" transform="translate(0 327.34) translate(859.6444999999999 12.559999999999995) scale(1.75) translate(-719.41681 50.4)"></path>
//                         </g>
//                         <image xlinkHref="" id="icon" x="0" y="0" style={{display: "none"}}></image>
//                     </g>
//                 </g>
//             </svg>
//         </div>
//     )
// }

// export default Logo
