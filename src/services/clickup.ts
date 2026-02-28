import { CLICKUP_LISTS } from '../config/clickupIds';

// Base da nossa rota de API interna do Next.js
const API_BASE = '/api/clickup';

// --- INTERFACES ---
// As interfaces ajudam o TypeScript a entender o formato dos dados que estamos recebendo da API.

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


// --- FUNÇÕES DE BUSCA (FETCH) ---

/**
 * Busca todas as listas (projetos) dentro de uma pasta específica.
 */
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

/**
 * Busca todas as tarefas dentro de uma lista específica.
 * [CORRIGIDO] Agora a URL é montada corretamente evitando erros de formatação com "?" e "&".
 */
export async function fetchTasks(listId: string, includeCustomFields = false): Promise<ClickUpTask[]> {
    // Prevenção de erro: se o listId não existir, interrompemos a busca e retornamos vazio.
    if (!listId) {
        console.warn('fetchTasks chamado com listId indefinido (undefined). Verifique seus IDs configurados.');
        return [];
    }
    
    try {
        // Usamos URLSearchParams para garantir que os parâmetros da URL fiquem perfeitos
        const queryParams = new URLSearchParams();
        queryParams.append('archived', 'false'); // Não queremos tarefas arquivadas
        
        // Adiciona os campos personalizados (custom fields) apenas se for solicitado
        if (includeCustomFields) {
            queryParams.append('include_custom_fields', 'true');
        }

        // Monta a URL final com segurança
        const url = `${API_BASE}/list/${listId}/task?${queryParams.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Falha ao buscar tarefas para a lista ${listId}: Status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verifica se data.tasks existe para evitar quebrar a aplicação caso a API mude a resposta
        if (data && data.tasks) {
            return data.tasks;
        } else {
             console.warn(`A API do ClickUp retornou um formato inesperado para a lista ${listId}`, data);
             return [];
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

/**
 * Conta o número total de tarefas em uma lista.
 */
export async function fetchListCount(listId: string): Promise<number> {
    try {
        const tasks = await fetchTasks(listId);
        return tasks.length;
    } catch (error) {
        console.error('Error fetching list count:', error);
        return 0;
    }
}

// --- FUNÇÕES ESPECÍFICAS DOS COMPONENTES ---

export async function fetchActiveClientsCount(): Promise<number> {
    return fetchListCount(CLICKUP_LISTS.ACC_OPERACAO_MACRO);
}

export async function fetchPendingMeetingsCount(): Promise<number> {
    const tasks = await fetchTasks(CLICKUP_LISTS.ACC_REUNIOES_PESQUISAS);
    // Filtra apenas as que não estão concluídas ou fechadas
    return tasks.filter(t => t.status.status !== 'complete' && t.status.status !== 'closed').length;
}

export async function fetchDemandsFilterCount(): Promise<number> {
    const tasks = await fetchTasks(CLICKUP_LISTS.ACC_FILTRO_DEMANDAS);
    // Filtra apenas as que não estão concluídas ou fechadas
    return tasks.filter(t => t.status.status !== 'complete' && t.status.status !== 'closed').length;
}

export async function fetchTrafficPipeline(): Promise<ClickUpTask[]> {
    return fetchTasks(CLICKUP_LISTS.GT_GESTAO_TRAFEGO);
}

export async function fetchClientTasks(listId: string): Promise<ClickUpTask[]> {
    return fetchTasks(listId);
}

export async function fetchMacroOperationTasks(): Promise<ClickUpTask[]> {
    // Aqui pedimos true para 'includeCustomFields' para pegar dados de responsáveis, status, etc.
    return fetchTasks(CLICKUP_LISTS.ACC_OPERACAO_MACRO, true);
}

/**
 * Busca tarefas de várias listas para agrupar na visão de "Performance Time"
 * [CORRIGIDO] Adicionado filtro de segurança caso algum ID esteja faltando no arquivo de configuração.
 */
export async function fetchAllOpenTasks(): Promise<ClickUpTask[]> {
    // Array com todos os IDs de listas que queremos buscar
    const listIds = [
        CLICKUP_LISTS.ACC_FILTRO_DEMANDAS,
        CLICKUP_LISTS.GT_GESTAO_TRAFEGO,
        CLICKUP_LISTS.GC_GESTAO_CONTEUDO,
        CLICKUP_LISTS.TICKETS,            
        CLICKUP_LISTS.DSN_ATIVE_CONECTA,  
        CLICKUP_LISTS.ACAO_METEORICA      
    ];

    // O .filter(Boolean) cria um novo array apenas com os IDs que realmente existem (não são undefined ou vazios)
    const validListIds = listIds.filter(Boolean);

    const allTasks: ClickUpTask[] = [];
    
    // Fazemos um loop passando por todos os IDs válidos
    for (const id of validListIds) {
        const tasks = await fetchTasks(id); // Busca as tarefas daquele ID específico
        allTasks.push(...tasks); // Junta essas tarefas no nosso "saco" total (allTasks)
    }
    
    return allTasks;
}