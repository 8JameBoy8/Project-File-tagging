import { describe, it, expect } from 'vitest'
import { getFileType, getFileExtension } from './fileUtils'

describe('getFileType', () => {
    it('detects image files', () => {
        expect(getFileType('photo.jpg')).toBe('image')
        expect(getFileType('photo.PNG')).toBe('image')
    })

    it('detects video files', () => {
        expect(getFileType('clip.mp4')).toBe('video')
    })

    it('detects audio files', () => {
        expect(getFileType('song.mp3')).toBe('audio')
    })

    it('detects document files', () => {
        expect(getFileType('report.pdf')).toBe('document')
    })

    it('falls back to "other" for unknown extensions', () => {
        expect(getFileType('archive.zip')).toBe('other')
    })

    it('falls back to "other" when there is no extension', () => {
        expect(getFileType('NoExt')).toBe('other')
    })
})

describe('getFileExtension', () => {
    it('returns the extension in uppercase', () => {
        expect(getFileExtension('photo.jpg')).toBe('JPG')
        expect(getFileExtension('document.PDF')).toBe('PDF')
    })

    it('returns "UNKNOWN" when there is no extension', () => {
        expect(getFileExtension('NoExt')).toBe('UNKNOWN')
    })
})
