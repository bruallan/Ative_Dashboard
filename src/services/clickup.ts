

import { CLICKUP_LISTS } from '../config/clickupIds';

const API_BASE = '/api/clickup';

export interface ClickUpTask {
    id: string;
    name: string;
    status: { status: string; color: string };
    assignees: { id: number; username: string; profilePicture: string; initials?: string; color?: string }[];
    due_date: string | null;
    custom_fields?: { id: string; name: string; type: string; value?: any; type_config?: any }[];
    list?: { id: string; name: string };
}

export interface ClickUpList {
    id: string;
    name: string;
}

export async function fetchLists(folderId: string): Promise<ClickUpList[]> {
    try {
        const response = await fetch(`${API_BASE}/folder/${folderId}/list?archived=false`);
        if (!response.ok) {
            throw new Error(`Failed to fetch lists for folder ${folderId}`);
        }
        const data = await response.json();
        return data.lists;
    } catch (error) {
        console.error('Error fetching lists:', error);
        return [];
    }
}

export async function fetchTasks(listId: string, includeCustomFields = false): Promise<ClickUpTask[]> {
    try {
        const query = includeCustomFields ? '?include_custom_fields=true' : '';
        const response = await fetch(`${API_BASE}/list/${listId}/task${query}&archived=false`);
        if (!response.ok) {
            throw new Error(`Failed to fetch tasks for list ${listId}`);
        }
        const data = await response.json();
        return data.tasks;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

export async function fetchListCount(listId: string): Promise<number> {
    try {
        const tasks = await fetchTasks(listId);
        return tasks.length;
    } catch (error) {
        console.error('Error fetching list count:', error);
        return 0;
    }
}

export async function fetchActiveClientsCount(): Promise<number> {
    return fetchListCount(CLICKUP_LISTS.ACC_OPERACAO_MACRO);
}

export async function fetchPendingMeetingsCount(): Promise<number> {
    const tasks = await fetchTasks(CLICKUP_LISTS.ACC_REUNIOES_PESQUISAS);
    return tasks.filter(t => t.status.status !== 'complete' && t.status.status !== 'closed').length;
}

export async function fetchDemandsFilterCount(): Promise<number> {
    const tasks = await fetchTasks(CLICKUP_LISTS.ACC_FILTRO_DEMANDAS);
    return tasks.filter(t => t.status.status !== 'complete' && t.status.status !== 'closed').length;
}

export async function fetchTrafficPipeline(): Promise<ClickUpTask[]> {
    return fetchTasks(CLICKUP_LISTS.GT_GESTAO_TRAFEGO);
}

export async function fetchClientTasks(listId: string): Promise<ClickUpTask[]> {
    return fetchTasks(listId);
}

export async function fetchMacroOperationTasks(): Promise<ClickUpTask[]> {
    return fetchTasks(CLICKUP_LISTS.ACC_OPERACAO_MACRO, true);
}

export async function fetchAllOpenTasks(): Promise<ClickUpTask[]> {
    // Fetch from main operational lists to aggregate per user
    const listIds = [
        CLICKUP_LISTS.ACC_FILTRO_DEMANDAS,
        CLICKUP_LISTS.GT_GESTAO_TRAFEGO,
        CLICKUP_LISTS.GC_GESTAO_CONTEUDO,
        CLICKUP_LISTS.TICKETS,
        CLICKUP_LISTS.DSN_ATIVE_CONECTA,
        CLICKUP_LISTS.ACAO_METEORICA
    ];

    const allTasks: ClickUpTask[] = [];
    for (const id of listIds) {
        const tasks = await fetchTasks(id);
        // Add list info to task if needed for context
        allTasks.push(...tasks);
    }
    return allTasks;
}
