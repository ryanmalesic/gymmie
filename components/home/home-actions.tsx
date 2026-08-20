import { Button } from '@/components/ui/button';

export function HomeActions(): React.ReactElement {
  return (
    <>
      <form action="/sign-in">
        <Button type="submit">Get Started</Button>
      </form>
      <form action="/sign-in">
        <Button type="submit" variant="outline">
          Learn More
        </Button>
      </form>
    </>
  );
}
