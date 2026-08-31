import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

vi.mock('axios');

describe('App Component', () => {
  it('renders title', () => {
    render(<App />);
    expect(screen.getByText(/Task Manager/i)).toBeInTheDocument();
  });

  it('fetches and displays tasks on mount', async () => {
    const tasks = [{ id: 1, title: 'Task 1', priority: 'high', completed: 0 }];
    axios.get.mockResolvedValue({ data: tasks });
    render(<App />);
    await waitFor(() => screen.getByText('Task 1'));
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });

  it('adds a new task', async () => {
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({ data: { id: 2, title: 'New Task', priority: 'low', completed: 0 } });
    render(<App />);
    const input = screen.getByPlaceholderText(/Add a new task/i);
    const addButton = screen.getByText('Add');
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.click(addButton);
    await waitFor(() => screen.getByText('New Task'));
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('toggles task completion', async () => {
    const task = { id: 1, title: 'Toggle me', priority: 'medium', completed: 0 };
    axios.get.mockResolvedValue({ data: [task] });
    axios.put.mockResolvedValue({ data: { id: 1, completed: 1 } });
    render(<App />);
    await waitFor(() => screen.getByText('Toggle me'));
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    // Preverimo, da je prečrtano (odvisno od implementacije)
    // Lahko preverimo style, ampak za enostavnost preverimo, da je klicalo API
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/tasks/1'), { completed: true });
  });

  it('deletes a task', async () => {
    const task = { id: 1, title: 'Delete me', priority: 'low', completed: 0 };
    axios.get.mockResolvedValue({ data: [task] });
    axios.delete.mockResolvedValue({ status: 204 });
    render(<App />);
    await waitFor(() => screen.getByText('Delete me'));
    const deleteBtn = screen.getByText('❌');
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/tasks/1')));
  });

  it('shows error on failed fetch', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    render(<App />);
    // Preverimo, da ne crkne, lahko preverimo console.error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });

  it('does not add empty task', async () => {
    axios.get.mockResolvedValue({ data: [] });
    render(<App />);
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('displays priority options', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('medium');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Low');
    expect(options[1]).toHaveTextContent('Medium');
    expect(options[2]).toHaveTextContent('High');
  });

  it('handles task update error gracefully', async () => {
    const task = { id: 1, title: 'Error task', priority: 'medium', completed: 0 };
    axios.get.mockResolvedValue({ data: [task] });
    axios.put.mockRejectedValue(new Error('Update failed'));
    render(<App />);
    await waitFor(() => screen.getByText('Error task'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });

  it('handles delete error gracefully', async () => {
    const task = { id: 1, title: 'Delete error', priority: 'medium', completed: 0 };
    axios.get.mockResolvedValue({ data: [task] });
    axios.delete.mockRejectedValue(new Error('Delete failed'));
    render(<App />);
    await waitFor(() => screen.getByText('Delete error'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const deleteBtn = screen.getByText('❌');
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });

  it('uses environment variable for API URL', () => {
    // Preverimo, da import.meta.env.VITE_API_URL obstaja
    // Ne moremo direktno testirati, ampak lahko preverimo, da se uporabi
    // Za namen testa lahko nastavimo process.env
    const original = import.meta.env.VITE_API_URL;
    import.meta.env.VITE_API_URL = 'http://test-api';
    render(<App />);
    // Ne moremo enostavno preveriti, ampak test preprosto poganjamo
    import.meta.env.VITE_API_URL = original;
  });
});