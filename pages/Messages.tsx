
import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import { getMessages, saveMessage } from '../services/dataService';
import { Mail, Inbox, Send, Search, User, Clock } from 'lucide-react';

export const Messages: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeBox, setActiveBox] = useState<'inbound' | 'outbound'>('outbound');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Load messages
        const allMsgs = getMessages();
        
        // Demo purpose: Add a welcome message if inbox is empty
        if (allMsgs.filter(m => m.direction === 'inbound').length === 0) {
             const welcomeMsg: Message = {
                 id: 'welcome-msg',
                 recipient: 'Demir Hocam',
                 subject: 'Sisteme Hoşgeldiniz',
                 body: 'Merhaba,\n\nÇalışma salonu yönetim sistemine hoşgeldiniz. Bu gelen kutusu, ileride eklenebilecek entegrasyonlar için hazırlanmıştır. Şu an için sadece sistem bildirimlerini veya manuel eklenen mesajları görebilirsiniz.\n\nİyi çalışmalar dileriz.',
                 type: 'email',
                 direction: 'inbound',
                 date: new Date().toISOString(),
                 isRead: false
             };
             saveMessage(welcomeMsg);
             setMessages([...allMsgs, welcomeMsg]);
        } else {
            setMessages(allMsgs);
        }
    }, []);

    const filteredMessages = messages
        .filter(m => m.direction === activeBox)
        .filter(m => 
            m.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (m.subject && m.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
            m.body.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="flex h-[calc(100vh-5rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden m-4">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Mail size={24} /> Mesajlar
                    </h2>
                </div>
                <div className="p-2 space-y-1">
                    <button 
                        onClick={() => { setActiveBox('inbound'); setSelectedMessage(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeBox === 'inbound' ? 'bg-white shadow text-brand-600 font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        <Inbox size={18} /> Gelen Kutusu
                    </button>
                    <button 
                        onClick={() => { setActiveBox('outbound'); setSelectedMessage(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeBox === 'outbound' ? 'bg-white shadow text-brand-600 font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        <Send size={18} /> Giden Kutusu
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Ara..." 
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredMessages.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Mesaj bulunamadı.
                        </div>
                    ) : (
                        filteredMessages.map(msg => (
                            <div 
                                key={msg.id}
                                onClick={() => setSelectedMessage(msg)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-brand-50 border-l-4 border-l-brand-500' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-900 text-sm truncate w-2/3">
                                        {msg.recipient}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(msg.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 truncate">
                                    {msg.subject || (msg.type === 'sms' ? 'SMS Mesajı' : 'Konusuz')}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${msg.type === 'email' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                        {msg.type.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedMessage ? (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {selectedMessage.subject || 'Konusuz Mesaj'}
                            </h3>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                        <User size={16} />
                                    </div>
                                    <span>
                                        {activeBox === 'outbound' ? 'Kime:' : 'Kimden:'} <span className="text-gray-900 font-medium">{selectedMessage.recipient}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    {new Date(selectedMessage.date).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {selectedMessage.body}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
                             <span className="text-xs text-gray-400">Mesaj ID: {selectedMessage.id}</span>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Mail size={48} className="mb-4 opacity-20" />
                        <p>Görüntülemek için bir mesaj seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
