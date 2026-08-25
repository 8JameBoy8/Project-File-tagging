import path from 'path'

export function getFileType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()

    const images = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const videos = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    const audios = ['.mp3', '.wav', '.ogg', '.m4a']
    const documents = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt']

    if (images.includes(ext)) return 'image'
    if (videos.includes(ext)) return 'video'
    if (audios.includes(ext)) return 'audio'
    if (documents.includes(ext)) return 'document'
    return 'other'
}

export function getFileExtension(filename: string): string {
    return path.extname(filename).slice(1).toUpperCase() || 'UNKNOWN'
}
