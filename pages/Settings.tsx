
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings, createBackup, restoreBackup, generateQRCodeData, mergeData } from '../services/dataService';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { QRScanner } from '../components/QRScanner';
import QRCode from 'react-qr-code';
import { Download, Upload, QrCode, Scan, Save, Smartphone, HardDrive, CreditCard, Mail } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  
  // Modal States
  const [qrGenModalOpen, setQrGenModalOpen] = useState(false);
  const [qrScanModalOpen, setQrScanModalOpen] = useState(false);
  
  // Data States
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    if (qrGenModalOpen) {
      setQrData(generateQRCodeData());
    }
  }, [qrGenModalOpen]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    showStatus('success', 'Tüm ayarlar ve fiyatlar başarıyla kaydedildi.');
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    showStatus('info', 'Yedek dosyası işleniyor...');
    const result = await restoreBackup(file);
    
    if (result.success) {
        showStatus('success', result.message + ' Sayfa yenileniyor...');
        setTimeout(() => window.location.reload(), 1500);
    } else {
        showStatus('error', result.message);
    }
    e.target.value = '';
  };

  const handleQRScanSuccess = (decodedText: string) => {
      setQrScanModalOpen(false);
      try {
          const data = JSON.parse(decodedText);
          const result = mergeData(data);
          if (result.success) {
              showStatus('success', result.message);
              setTimeout(() => window.location.reload(), 1500);
          } else {
              showStatus('error', result.message);
          }
      } catch (e) {
          showStatus('error', 'QR Kod içeriği geçersiz veya okunamadı.');
      }
  };

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
      setStatusMsg({ type, text });
      if (type !== 'error') {
          setTimeout(() => setStatusMsg(null), 5000);
      }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-2xl font-bold text-gray-800">Sistem Ayarları</h2>
         {statusMsg && (
             <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-fade-in ${
                 statusMsg.type === 'success' ? 'bg-green-100 text-green-800' :
                 statusMsg.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
             }`}>
                 {statusMsg.text}
             </div>
         )}
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Pricing & Finance */}
        <div className="space-y-8">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Fiyatlandırma</h3>
                        <p className="text-sm text-gray-500">Abonelik ücretleri</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Abonelik Ücreti (TL)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full p-2 pl-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                                value={settings.pricing.monthlyPrice}
                                onChange={e => setSettings({...settings, pricing: {...settings.pricing, monthlyPrice: Number(e.target.value)}})}
                            />
                            <span className="absolute right-3 top-2 text-gray-400">₺</span>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Yıllık Abonelik Ücreti (TL)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full p-2 pl-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                                value={settings.pricing.yearlyPrice}
                                onChange={e => setSettings({...settings, pricing: {...settings.pricing, yearlyPrice: Number(e.target.value)}})}
                            />
                            <span className="absolute right-3 top-2 text-gray-400">₺</span>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deneme Ücreti (TL)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full p-2 pl-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                                value={settings.pricing.trialPrice}
                                onChange={e => setSettings({...settings, pricing: {...settings.pricing, trialPrice: Number(e.target.value)}})}
                            />
                            <span className="absolute right-3 top-2 text-gray-400">₺</span>
                        </div>
                    </div>
                </div>
             </div>
             
             {/* Data Management in Col 1 as well */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <HardDrive size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Yedekleme</h3>
                        <p className="text-sm text-gray-500">Veri güvenliği</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button type="button" onClick={createBackup} variant="outline" className="flex-1 text-xs">
                        <Download size={14} className="mr-1" /> İndir
                    </Button>
                    <div className="relative flex-1">
                        <input type="file" id="restore-btn" className="hidden" accept=".json" onChange={handleFileRestore} />
                        <label htmlFor="restore-btn" className="flex items-center justify-center w-full h-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <Upload size={14} className="mr-1" /> Yükle
                        </label>
                    </div>
                </div>
             </div>
        </div>

        {/* Column 2: Integrations (Gmail & NetGSM) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <Mail size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Entegrasyonlar</h3>
                    <p className="text-sm text-gray-500">E-posta ve SMS</p>
                </div>
            </div>
            
            <div className="space-y-6">
                {/* SMTP Section */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-red-100">
                    <h4 className="text-sm font-bold text-red-800 border-b border-red-200 pb-2 flex justify-between">
                        Gmail Entegrasyonu 
                        <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Aktif</span>
                    </h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Gmail Adresi</label>
                        <input 
                            type="email" 
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            value={settings.smtp.email}
                            onChange={e => setSettings({...settings, smtp: {...settings.smtp, email: e.target.value}})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Uygulama Şifresi / Password</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                value={settings.smtp.appPassword}
                                onChange={e => setSettings({...settings, smtp: {...settings.smtp, appPassword: e.target.value}})}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Google hesabınızla giriş simülasyonu için kullanılır.</p>
                        </div>
                    </div>
                </div>

                {/* NetGSM Section */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 border-b pb-2">NetGSM SMS API</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kullanıcı Adı</label>
                            <input 
                                type="text" 
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                                value={settings.netgsm.username}
                                onChange={e => setSettings({...settings, netgsm: {...settings.netgsm, username: e.target.value}})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Şifre</label>
                            <input 
                                type="password" 
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                                value={settings.netgsm.password}
                                onChange={e => setSettings({...settings, netgsm: {...settings.netgsm, password: e.target.value}})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Başlık (Header)</label>
                        <input 
                            type="text" 
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                            value={settings.netgsm.header}
                            onChange={e => setSettings({...settings, netgsm: {...settings.netgsm, header: e.target.value}})}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Column 3: Mobile & Save */}
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Mobil Erişim</h3>
                        <p className="text-sm text-gray-500">QR Kod ile transfer</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button 
                        type="button"
                        onClick={() => setQrGenModalOpen(true)}
                        className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <QrCode size={24} className="text-purple-600" />
                            <div className="text-left">
                                <span className="block font-medium text-purple-900">QR Kod Oluştur</span>
                                <span className="text-xs text-purple-600">Telefona Aktar</span>
                            </div>
                        </div>
                    </button>

                    <button 
                        type="button"
                        onClick={() => setQrScanModalOpen(true)}
                        className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                             <Scan size={24} className="text-purple-600" />
                             <div className="text-left">
                                <span className="block font-medium text-purple-900">QR Tara</span>
                                <span className="text-xs text-purple-600">Telefondan Al</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <Button type="submit" size="lg" className="w-full py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                <Save size={20} className="mr-2" />
                Ayarları Kaydet
            </Button>
        </div>
      </form>

      {/* Modals */}
      <Modal
        isOpen={qrGenModalOpen}
        onClose={() => setQrGenModalOpen(false)}
        title="Mobil Uygulama İçin QR Kod"
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <div className="p-4 bg-white border-4 border-gray-800 rounded-xl shadow-lg">
            <QRCode value={qrData} size={220} />
          </div>
          <p className="text-sm text-center text-gray-600">
            Mobil uygulamadan "Veri Al" diyerek bu kodu okutun.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={qrScanModalOpen}
        onClose={() => setQrScanModalOpen(false)}
        title="QR Kod Tara"
      >
         <QRScanner qrCodeSuccessCallback={handleQRScanSuccess} />
      </Modal>

    </div>
  );
};
