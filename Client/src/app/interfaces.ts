export interface CreateSession {
    sessionID: string,
    sessionQR: string
}

export interface Song {
    user: string,
    uri: string
}

export interface User {
    Songs: number,
    Color: string,
    Leader: boolean
}