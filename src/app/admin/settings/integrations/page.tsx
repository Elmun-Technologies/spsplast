import { db as prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Integratsiyalar sozlamalari | SPS Plast Admin',
};

export default async function AdminIntegrationsPage() {
    const amoToken = await prisma.amoCrmToken.findFirst({
        orderBy: { updatedAt: 'desc' },
    });

    const recentJobs = await prisma.integrationJob.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
    });

    const recentLogs = await prisma.integrationLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
    });

    const clickMerchantId = process.env.CLICK_MERCHANT_ID || '';
    const paymeMerchantId = process.env.PAYME_MERCHANT_ID || '';
    const amoSubdomain = process.env.AMOCRM_SUBDOMAIN || '';
    const amoClientId = process.env.AMOCRM_CLIENT_ID || '';
    const amoRedirectUri = process.env.AMOCRM_REDIRECT_URI || '';

    const amoAuthUrl = amoSubdomain && amoClientId
        ? `https://${amoSubdomain}.amocrm.ru/oauth?client_id=${amoClientId}&mode=popup`
        : '#';

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tashqi integratsiyalar (External Integrations)</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Click, Payme va amoCRM integratsiyalari holati va sozlamalari.
                </p>
            </div>

            {/* Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Click */}
                <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Click.uz</h3>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${clickMerchantId ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {clickMerchantId ? 'Sozlangan' : 'Kalitlar kiritilmagan'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-4">
                            Click to‘lov tizimi orqali milliy kartalardan avtomatik to‘lov qabul qilish.
                        </p>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Merchant ID:</span>
                                <span className="font-mono text-gray-900">{clickMerchantId || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Callback URL:</span>
                                <span className="font-mono text-gray-900 text-[10px]">/api/payments/click</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payme */}
                <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Payme.uz</h3>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${paymeMerchantId ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {paymeMerchantId ? 'Sozlangan' : 'Kalitlar kiritilmagan'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-4">
                            Payme to‘lov tizimi JSON-RPC protokoli orqali avtomatik to‘lov.
                        </p>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Merchant ID:</span>
                                <span className="font-mono text-gray-900">{paymeMerchantId || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Callback URL:</span>
                                <span className="font-mono text-gray-900 text-[10px]">/api/payments/payme</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* amoCRM */}
                <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">amoCRM</h3>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${amoToken ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {amoToken ? 'Ulangan' : 'Ulanmagan'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-4">
                            Buyurtmalarni avtomatik tarzda amoCRM lidlar va kontaktlariga eksport qilish.
                        </p>
                        <div className="space-y-2 text-xs mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subdomain:</span>
                                <span className="font-mono text-gray-900">{amoSubdomain || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Client ID:</span>
                                <span className="font-mono text-gray-900">{amoClientId ? '••••••••' : '—'}</span>
                            </div>
                        </div>
                    </div>
                    {amoSubdomain && amoClientId ? (
                        <a
                            href={amoAuthUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-block text-center py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                        >
                            {amoToken ? 'amoCRM Qayta ulash' : 'amoCRM-ga ulanish'}
                        </a>
                    ) : (
                        <span className="text-xs text-amber-600 italic">.env faylda AMOCRM_SUBDOMAIN kiritilmagan</span>
                    )}
                </div>
            </div>

            {/* Outbox Jobs */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Navbatdagi topshiriqlar (Integration Jobs Outbox)</h2>
                {recentJobs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Hozircha navbatda topshiriqlar yo‘q.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Turi</th>
                                    <th className="p-3">Holati</th>
                                    <th className="p-3">Urinishlar</th>
                                    <th className="p-3">Sana</th>
                                    <th className="p-3">Xatolik</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentJobs.map((job) => (
                                    <tr key={job.id}>
                                        <td className="p-3 font-mono">{job.id.substring(0, 8)}...</td>
                                        <td className="p-3 font-semibold">{job.type}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${job.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                                job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="p-3">{job.attempts}</td>
                                        <td className="p-3 text-gray-500">{new Date(job.createdAt).toLocaleString()}</td>
                                        <td className="p-3 text-red-600 font-mono max-w-xs truncate">{job.lastError || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Integration Audit Logs */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Integratsiya jurnali (Integration Audit Logs)</h2>
                {recentLogs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Hozircha amallar jurnali bo‘sh.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="p-3">Provider</th>
                                    <th className="p-3">Operatsiya</th>
                                    <th className="p-3">Entity</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Vaqt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="p-3 font-bold">{log.provider}</td>
                                        <td className="p-3 font-mono">{log.operation}</td>
                                        <td className="p-3">{log.entityType} ({log.entityId ? log.entityId.substring(0, 8) : '—'})</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
