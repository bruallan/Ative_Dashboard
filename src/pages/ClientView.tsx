





import React, { useState, useEffect } from 'react';
import { fetchClientTasks, fetchMacroOperationTasks, ClickUpTask } from '../services/clickup';
import { CLIENT_LIST_MAP } from '../config/clickupIds';

const ClientView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'donut' | 'kanban'>('donut');
    const [selectedClientName, setSelectedClientName] = useState<string>('');
    const [clientTasks, setClientTasks] = useState<ClickUpTask[]>([]); // Tasks from the client's specific list
    const [macroTasks, setMacroTasks] = useState<ClickUpTask[]>([]); // All clients from Macro list
    const [clientInfo, setClientInfo] = useState<any>(null);
    const [operationalTasks, setOperationalTasks] = useState<ClickUpTask[]>([]);

    useEffect(() => {
        // Fetch Macro Operation Tasks (These represent the Clients)
        fetchMacroOperationTasks().then(tasks => {
            setMacroTasks(tasks);
            if (tasks.length > 0) {
                // Default to the first client found
                setSelectedClientName(tasks[0].name);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedClientName) {
            // 1. Find Client Info from Macro Task
            const infoTask = macroTasks.find(t => t.name === selectedClientName);
            
            if (infoTask) {
                // Extract Custom Fields
                const onboardingField = infoTask.custom_fields?.find(f => f.name.toLowerCase().includes('onboarding'));
                const accountField = infoTask.custom_fields?.find(f => f.name.toLowerCase().includes('account'));
                const gtField = infoTask.custom_fields?.find(f => f.name.toLowerCase().includes('tráfego') || f.name.toLowerCase().includes('gt'));
                const gcField = infoTask.custom_fields?.find(f => f.name.toLowerCase().includes('conteúdo') || f.name.toLowerCase().includes('gc'));

                setClientInfo({
                    onboarding: onboardingField?.type === 'drop_down' ? 
                        (onboardingField.type_config.options.find((o: any) => o.orderindex === onboardingField.value)?.name || 'N/A') : 
                        (onboardingField?.value || 'Ongoing'),
                    account: accountField?.value?.map((u: any) => u.username).join(', ') || 'N/A',
                    gt: gtField?.value?.map((u: any) => u.username).join(', ') || 'N/A',
                    gc: gcField?.value?.map((u: any) => u.username).join(', ') || 'N/A'
                });
            } else {
                setClientInfo(null);
            }

            // 2. Fetch Operational Tasks for the Client
            // Try to find the list ID from the map
            // We try exact match or partial match
            let listId = CLIENT_LIST_MAP[selectedClientName];
            if (!listId) {
                // Try to find a key that is part of the client name or vice versa
                const key = Object.keys(CLIENT_LIST_MAP).find(k => selectedClientName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(selectedClientName.toLowerCase()));
                if (key) listId = CLIENT_LIST_MAP[key];
            }

            if (listId) {
                fetchClientTasks(listId).then(setOperationalTasks);
            } else {
                setOperationalTasks([]);
            }

        } else {
            setOperationalTasks([]);
            setClientInfo(null);
        }
    }, [selectedClientName, macroTasks]);

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedClientName(e.target.value);
    };
    
    return (
        <div id="tab-clientes" className="tab-content" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="header">
                <div className="page-title">
                    <h1>Lupa por Cliente</h1>
                </div>
            </div>

            <select className="client-selector" value={selectedClientName} onChange={handleClientChange}>
                <option value="" disabled>Selecione um Cliente</option>
                {macroTasks.map(task => (
                    <option key={task.id} value={task.name}>{task.name}</option>
                ))}
            </select>

            {clientInfo && (
                <div className="client-info-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div><strong>Status:</strong> <span style={{ color: 'var(--primary)' }}>{clientInfo.onboarding}</span></div>
                    <div><strong>Account:</strong> {clientInfo.account}</div>
                    <div><strong>GT:</strong> {clientInfo.gt}</div>
                    <div><strong>GC:</strong> {clientInfo.gc}</div>
                </div>
            )}

            <div className="grid-container" style={{ width: '100%' }}>
                <div className="card full-width border-2 border-green-500" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Saúde do Cliente por Etapa</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setViewMode('donut')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: viewMode === 'donut' ? 'none' : '1px solid #e5e7eb',
                                    background: viewMode === 'donut' ? 'var(--primary)' : 'white',
                                    color: viewMode === 'donut' ? 'white' : 'var(--text-main)',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                <i className="fa-solid fa-chart-pie" style={{ marginRight: '5px' }}></i>
                                Resumo
                            </button>
                            <button 
                                onClick={() => setViewMode('kanban')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: viewMode === 'kanban' ? 'none' : '1px solid #e5e7eb',
                                    background: viewMode === 'kanban' ? 'var(--primary)' : 'white',
                                    color: viewMode === 'kanban' ? 'white' : 'var(--text-main)',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                <i className="fa-solid fa-list-check" style={{ marginRight: '5px' }}></i>
                                Kanban
                            </button>
                        </div>
                    </div>

                    {viewMode === 'donut' ? (
                        <div className="donut-container">
                            <div className="donut-wrapper">
                                <div className="donut-chart" style={{ background: 'conic-gradient(#3b82f6 0% 70%, #e5e7eb 70% 100%)' }}>
                                    <div className="donut-inner">70%</div>
                                </div>
                                <div className="donut-legend">Account & Estratégia</div>
                                <div style={{ fontSize: '10px', color: '#6b7280' }}>7 Feitas / 3 Pendentes</div>
                            </div>
                            <div className="donut-wrapper">
                                <div className="donut-chart" style={{ background: 'conic-gradient(#f59e0b 0% 40%, #e5e7eb 40% 100%)' }}>
                                    <div className="donut-inner">40%</div>
                                </div>
                                <div className="donut-legend">Conteúdo</div>
                                <div style={{ fontSize: '10px', color: '#6b7280' }}>Aguardando Aprovação</div>
                            </div>
                            <div className="donut-wrapper">
                                <div className="donut-chart" style={{ background: 'conic-gradient(#10b981 0% 90%, #e5e7eb 90% 100%)' }}>
                                    <div className="donut-inner">90%</div>
                                </div>
                                <div className="donut-legend">Tráfego & Performance</div>
                                <div style={{ fontSize: '10px', color: '#6b7280' }}>Campanhas Rodando</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
                            {/* Coluna Geral (Tasks from Operational List) */}
                            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '12px', gridColumn: '1 / -1' }}>
                                <h4 style={{ margin: '0 0 15px', fontSize: '14px', color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
                                    Tarefas Operacionais (ClickUp)
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {operationalTasks.length === 0 && <p style={{ fontSize: '12px', color: '#6b7280' }}>Nenhuma tarefa encontrada ou lista não mapeada.</p>}
                                    {operationalTasks.map(task => (
                                        <div key={task.id} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                                            <div style={{ fontWeight: 600, marginBottom: '5px' }}>{task.name}</div>
                                            <div style={{ color: task.status.color, fontSize: '10px' }}>● {task.status.status.toUpperCase()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card full-width border-2 border-yellow-500" style={{ minHeight: '600px' }}>
                    <h3>Performance Tráfego (Looker)</h3>
                    <div style={{ height: '100%', width: '100%', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: '550px' }}>
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src="https://lookerstudio.google.com/embed/reporting/fe045f5b-e1e8-4105-acaf-56f759367bb4/page/E5RwD" 
                            frameBorder="0" 
                            style={{ border: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                            allowFullScreen
                            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientView;
