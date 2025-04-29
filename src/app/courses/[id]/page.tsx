import prisma from "@/lib/prismadb";
import Navbar from "@/components/Navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
// import toast from 'sonner'; (unused)
import CourseProgress from "@/components/CourseProgress";
import { CourseWithInstructor } from "@/components/CourseCatalogue";
import Link from 'next/link';

export const dynamic = "force-dynamic";

// @ts-nocheck
export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await (prisma as any).course.findUnique({
    where: { id },
    include: {
      instructor: { select: { name: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          contents: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!course) {
    return (
      <>
        <Navbar title="Course Not Found" />
        <div className="max-w-3xl mx-auto mt-20 px-4">
          <p className="text-center text-gray-600">This course does not exist.</p>
        </div>
      </>
    );
  }



  return (
    <>
      <Navbar title={course.title} />
      <div className="max-w-3xl mx-auto mt-20 px-4 space-y-6">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-gray-700">{course.description}</p>
        <div className="flex items-center text-sm text-gray-600 gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback>{(course.instructor?.name || 'U')[0]}</AvatarFallback>
          </Avatar>
          <span>Instructor: {course.instructor?.name || 'Unknown'} | Duration: {Math.floor(course.duration/60)}h {course.duration%60}m</span>
        </div>
        <Tabs defaultValue={course.modules[0]?.id} className="space-y-4">
          <TabsList>
            {course.modules.map((mod: any) => (
              <TabsTrigger key={mod.id} value={mod.id}>{mod.title}</TabsTrigger>
            ))}
          </TabsList>
          {course.modules.map((mod: any) => (
            <TabsContent key={mod.id} value={mod.id}>
              <Accordion type="multiple" className="space-y-2">
                {mod.contents.map((ct: any) => (
                  <AccordionItem key={ct.id} value={ct.id}>
                    <AccordionTrigger>{ct.order}. {ct.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="border p-4 rounded">
                        <h3 className="text-lg font-medium">{ct.order}. {ct.title}</h3>
                        <p className="text-sm text-gray-600">Type: {ct.type}</p>
                        {ct.type === 'VIDEO' && (() => {
                          const url = ct.url;
                          let embedUrl = url.includes('watch?v=')
                            ? url.replace('watch?v=', 'embed/')
                            : url.includes('youtu.be/')
                            ? url.replace('youtu.be/', 'youtube.com/embed/')
                            : url;
                          return embedUrl.includes('embed') ? (
                            <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; clipboard-write; gyroscope; picture-in-picture" allowFullScreen className="mt-2 w-full aspect-video rounded" />
                          ) : (
                            <video src={url} controls className="mt-2 w-full rounded" />
                          );
                        })()}
                        {ct.type === 'PDF' && (
                          <>
                            <embed src={ct.url} type="application/pdf" className="mt-2 w-full h-96 rounded" />
                            <Button asChild variant="link" className="block mt-2"><a href={ct.url} download>Download PDF</a></Button>
                          </>
                        )}
                        {ct.type === 'LIVE' && (
                          <Button asChild variant="default" className="mt-2"><a href={ct.joinUrl} target="_blank" rel="noopener noreferrer">Join Live Session</a></Button>
                        )}
                        {ct.type === 'QUIZ' ? (
                          <Link href={`/courses/${id}/quiz?contentId=${ct.id}`}> 
                            <Button className="mt-2">Start Secure Quiz</Button>
                          </Link>
                        ) : (
                          <Button asChild variant="link" className="mt-2"><a href={ct.url} target="_blank" rel="noopener noreferrer">Access Content</a></Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
        <CourseProgress modules={course.modules} />
      </div>
    </>
  );
}
