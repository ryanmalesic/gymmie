import { HomeActions } from '@/components/home/home-actions';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home(): React.ReactElement {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Gymmie</CardTitle>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <CardDescription>Your personal fitness companion</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <p className="text-muted-foreground">
            Track workouts, monitor progress, and achieve your fitness goals — all in one place.
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <HomeActions />
        </CardFooter>
      </Card>
    </div>
  );
}
