'use server'

import { supabase } from './supabase'
import { customAlphabet } from 'nanoid'
import { Column, Task } from '../types/kanban'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

const defaultBoardData: { columns: Column[]; tasks: Task[] } = {
  columns: [
    { id: 'to-do', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ],
  tasks: [],
}

export async function createBoard(defaultData = defaultBoardData) {
  const code = nanoid()

  const { data, error } = await supabase
    .from('boards')
    .insert([{ code, data: defaultData }])
    .select()
    .single()

  if (error) {
    console.error('Error creating board:', error)
    throw new Error('Failed to create board')
  }

  return data.code
}

export async function getBoard(code: string) {
  const { data, error } = await supabase.from('boards').select('*').eq('code', code).single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not Found
    console.error('Error getting board:', error)
    return null
  }

  return data
}

export async function updateBoard(code: string, newData: { columns: Column[]; tasks: Task[] }) {
  const { error } = await supabase
    .from('boards')
    .update({
      data: newData,
      updated_at: new Date().toISOString(),
    })
    .eq('code', code)

  if (error) {
    console.error('Error updating board:', error)
    throw new Error('Failed to update board')
  }
  return true
}
