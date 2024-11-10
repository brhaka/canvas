/* eslint-disable react/prop-types */
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dice6 } from "lucide-react"
import { generateRandomUsername } from '@/lib/utils'

export function UserConfigModal({ isHost, onSubmit }) {
  const [username, setUsername] = useState('')
  const [limitUserSpace, setLimitUserSpace] = useState(false)

  const handleRandomUsername = () => {
    setUsername(generateRandomUsername())
  }

  const handleSubmit = () => {
    if (!username.trim()) return

    onSubmit({
      username: username.trim(),
      limitUserSpace: false
    })
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Canvas</CardTitle>
          <CardDescription>
            {isHost
              ? "Set up your canvas preferences as the host"
              : "Join the canvas session"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Username Input Section */}
          <div className="space-y-2">
            <Label htmlFor="username">Choose your alias</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleRandomUsername}
                title="Generate random username"
              >
                <Dice6 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Host-only Settings */}
          {isHost && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="limitSpace">Limit user space</Label>
                  <p className="text-sm text-muted-foreground">
                    This will limit user space to 100x100 pixels positioned randomly.
                    Area may overlap for greater experience.
                  </p>
                </div>
                <Switch
                  id="limitSpace"
                  checked={limitUserSpace}
                  onCheckedChange={setLimitUserSpace}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!username.trim()}
          >
            Start Drawing
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}