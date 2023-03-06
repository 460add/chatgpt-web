declare namespace Chat {

	// 单条聊天
	interface Chat {
		id: number
		dateTime: string
		text: string
		inversion?: boolean
		error?: boolean
		loading?: boolean
		requestOptions: { prompt: string; options?: ConversationRequest | null }
		responseOptions: ConversationResponse | null
	}

	interface History {
		title: string
		isEdit: boolean
		uuid: number
	}

	interface ChatState {
		active: number | null
		history: History[]
		chat: { uuid: number; data: Chat[] }[]
	}

	interface ConversationRequest {
		regenerate?: number // 重载？重置消息的id
		conversationId: number // 会话id
		parentMessageId: number // 父消息id
	}

	interface ConversationResponse {
		role: string
		id: number
		conversationId: number
		parentMessageId: number
		text: string
	}
}
