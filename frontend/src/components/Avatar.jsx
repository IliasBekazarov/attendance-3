import { useState } from 'react'

const Avatar = ({ src, alt = 'User', size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  }
  
  const handleImageError = () => {
    setImageError(true)
  }
  
  // Эгер фото жок болсо же ката болсо - иконка көрсөт
  if (!src || imageError) {
    return (
      <div className={`avatar-placeholder ${sizeClasses[size]} ${className}`}>
        <i className="fas fa-user"></i>
      </div>
    )
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={`avatar-img ${sizeClasses[size]} ${className}`}
      onError={handleImageError}
    />
  )
}

export default Avatar
