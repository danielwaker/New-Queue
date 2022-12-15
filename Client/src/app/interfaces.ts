export interface CreateSession {
    sessionID: string,
    sessionQR: string
}

export interface Song {
    user: string,
    uri: string
}

export interface User {
    songs: number,
    color: string,
    leader: boolean
}