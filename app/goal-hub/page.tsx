'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, Target, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Goal {
  id: string
  title: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed'
  progress: number
  startDate: string
  endDate: string
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
}

export default function GoalHubPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  
  // Mock data for goals - this would come from your API
  useEffect(() => {
    const mockGoals: Goal[] = [
      {
        id: 'goal-1',
        title: 'Research Quantum Computing Applications',
        description: 'Explore how quantum computing can be applied to LLM optimization',
        status: 'in-progress',
        progress: 65,
        startDate: '2023-10-15',
        endDate: '2024-01-15',
        tasks: [
          { id: 'task-1', title: 'Literature review', completed: true },
          { id: 'task-2', title: 'Experiment design', completed: true },
          { id: 'task-3', title: 'Initial testing', completed: false },
          { id: 'task-4', title: 'Analysis', completed: false },
        ]
      },
      {
        id: 'goal-2',
        title: 'Optimize LLM Response Times',
        description: 'Reduce average response time by 30% through caching and model optimization',
        status: 'not-started',
        progress: 0,
        startDate: '2023-11-01',
        endDate: '2024-02-01',
        tasks: [
          { id: 'task-5', title: 'Baseline measurement', completed: false },
          { id: 'task-6', title: 'Caching implementation', completed: false },
          { id: 'task-7', title: 'Performance testing', completed: false },
        ]
      },
      {
        id: 'goal-3',
        title: 'Improve Multi-Model Consistency',
        description: 'Ensure consistent quality across different LLM providers',
        status: 'completed',
        progress: 100,
        startDate: '2023-09-01',
        endDate: '2023-12-01',
        tasks: [
          { id: 'task-8', title: 'Define quality metrics', completed: true },
          { id: 'task-9', title: 'Create evaluation suite', completed: true },
          { id: 'task-10', title: 'Testing and refinement', completed: true },
        ]
      }
    ]
    setGoals(mockGoals)
    if (mockGoals.length > 0) {
      setActiveGoal(mockGoals[0])
    }
  }, [])

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in-progress': return 'bg-blue-500'
      case 'delayed': return 'bg-red-500'
      case 'not-started': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />
      case 'delayed': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'not-started': return <Clock className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const handleNewGoal = () => {
    // This would open a dialog to create a new goal
    alert('New goal creation would open here')
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8" />
              Goal Hub
            </h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your multi-LLM optimization goals
            </p>
          </div>
          <Button onClick={handleNewGoal}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {goals.map((goal) => (
          <Card 
            key={goal.id} 
            className={`cursor-pointer hover:shadow-lg transition-shadow ${
              activeGoal?.id === goal.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setActiveGoal(goal)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(goal.status)}
                  <Badge className={`${getStatusColor(goal.status)} text-white ml-2 capitalize`}>
                    {goal.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
              
              <div className="mb-2 flex justify-between text-sm">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2 mb-4" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {goal.tasks.filter(t => t.completed).length}/{goal.tasks.length} tasks
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeGoal && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {activeGoal.title}
                    <Badge className={`${getStatusColor(activeGoal.status)} text-white ml-2 capitalize`}>
                      {activeGoal.status.replace('-', ' ')}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{activeGoal.description}</CardDescription>
                </div>
                <Button variant="outline" onClick={() => alert('Goal editing would open here')}>
                  Edit Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{activeGoal.progress}%</span>
                </div>
                <Progress value={activeGoal.progress} className="h-3" />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Tasks</h3>
                <div className="space-y-3">
                  {activeGoal.tasks.map((task) => (
                    <div key={task.id} className="flex items-center p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        onChange={() => alert('Task completion would be updated here')}
                      />
                      <span className={`ml-3 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span className="ml-auto text-sm text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-medium mb-3">Goal Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p>{new Date(activeGoal.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p>{new Date(activeGoal.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="capitalize">{activeGoal.status.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p>{activeGoal.progress}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}