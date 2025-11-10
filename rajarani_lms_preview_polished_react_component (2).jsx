import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { FolderOpen, ChevronRight, Award, BarChart3, Plus, Upload, Trash2, Eye, Search } from "lucide-react";

type ContentItem = {
  id: number;
  type: "pdf" | "video";
  name: string;
  duration?: number;
  dataUrl?: string;
};

type ModuleItem = {
  id: number;
  title: string;
  info: string;
  contents: ContentItem[];
  viewed: number[];
  quiz?: { id: number; title: string; questions: number };
  done: boolean;
};

const initialModules: ModuleItem[] = [
  {
    id: 1,
    title: "Social Media Etiquette",
    info: "Instagram/YouTube/Facebook DMs & comments policy.",
    contents: [
      { id: 11, type: "pdf", name: "DM Policy – Starter.pdf" },
      { id: 12, type: "video", name: "Polite Replies Demo.mp4", duration: 8 }
    ],
    viewed: [],
    done: false
  },
  {
    id: 2,
    title: "WhatsApp Communication",
    info: "Templates, etiquettes, leads & follow‑ups.",
    contents: [
      { id: 21, type: "pdf", name: "WA Templates Pack.pdf" },
      { id: 22, type: "video", name: "Lead Conversion Tips.mp4", duration: 8 }
    ],
    viewed: [],
    done: false
  },
  {
    id: 3,
    title: "Call Flow",
    info: "Inbound/Outbound flow, notes discipline.",
    contents: [
      { id: 31, type: "pdf", name: "Call Script L1.pdf" },
      { id: 32, type: "video", name: "Call Handling Example.mp4", duration: 8 }
    ],
    viewed: [],
    done: false
  },
  {
    id: 4,
    title: "Sales vs Support",
    info: "Right bucketing, conversion & resolution.",
    contents: [{ id: 41, type: "pdf", name: "Qualification Checklist.pdf" }],
    viewed: [],
    done: false
  },
  {
    id: 5,
    title: "Escalation Process",
    info: "3‑level escalation matrix with SLA.",
    contents: [{ id: 51, type: "pdf", name: "Escalation Matrix.pdf" }],
    viewed: [],
    done: false
  },
  {
    id: 6,
    title: "Daily Report Submission",
    info: "Shift summary, leads, closures, pending items.",
    contents: [{ id: 61, type: "video", name: "How to fill DSR.mp4", duration: 8 }],
    viewed: [],
    done: false
  }
];

export default function RajaraniLMSPreview() {
  const [role, setRole] = useState<"New Joiner" | "Trainer">("New Joiner");
  const [nav, setNav] = useState("Dashboard");
  const [showIntro, setShowIntro] = useState(false);
  const [certToast, setCertToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const theme = useMemo(
    () => ({
      primary: "#0B3B3C",
      accent: "#C8A133",
      bg: "#F6F5F0",
      soft: "#EAF2EF"
    }),
    []
  );

  const [modules, setModules] = useState<ModuleItem[]>(() => {
    try {
      const cached = localStorage.getItem("rrc_lms_modules_v2");
      return cached ? (JSON.parse(cached) as ModuleItem[]) : initialModules;
    } catch {
      return initialModules;
    }
  });

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(() => {
    try {
      return (
        (window as any).RAJARANI_LOGO_URL ||
        localStorage.getItem("rrc_logo_data_url") ||
        null
      );
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("rrc_lms_modules_v2", JSON.stringify(modules));
    } catch {}
  }, [modules]);

  useEffect(() => {
    if (logoDataUrl) {
      try {
        localStorage.setItem("rrc_logo_data_url", logoDataUrl);
      } catch {}
    }
  }, [logoDataUrl]);

  const [player, setPlayer] = useState<
    null | { mid: number; cid: number; progress: number; playing: boolean }
  >(null);
  const [nextQuiz, setNextQuiz] = useState<
    null | { mid: number; title: string; questions: number }
  >(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (player) setPlayer(null);
        if (nextQuiz) setNextQuiz(null);
        if (showIntro) setShowIntro(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, nextQuiz, showIntro]);

  const moduleProgress = (m: ModuleItem) => {
    const total = m.contents.length;
    const viewed = m.viewed.length;
    const pct = total === 0 ? 0 : Math.round((viewed / total) * 100);
    return { total, viewed, pct };
  };

  function markViewed(mid: number, cid: number) {
    setModules(prev => prev.map(m => {
      if (m.id !== mid) return m;
      const viewedSet = new Set(m.viewed);
      viewedSet.add(cid);
      const updated: ModuleItem = { ...m, viewed: Array.from(viewedSet) };
      const { total, viewed } = moduleProgress(updated);
      const allViewed = viewed === total && total > 0;
      if (allViewed) {
        if (updated.quiz) {
          setNextQuiz({ mid: updated.id, title: updated.quiz.title, questions: updated.quiz.questions });
        } else {
          updated.done = true;
        }
      }
      return updated;
    }));
  }

  function openContent(mid: number, item: ContentItem) {
    if (item.type === "pdf") {
      setPlayer({ mid, cid: item.id, progress: 100, playing: false });
      markViewed(mid, item.id);
    } else {
      setPlayer({ mid, cid: item.id, progress: 0, playing: true });
    }
  }

  function addModule() {
    const title = prompt("Module title?")?.trim();
    if (!title) return;
    const info = prompt("Short description?")?.trim() || "";
    setModules(prev => [...prev, { id: Date.now(), title, info, contents: [], viewed: [], done: false }]);
  }

  function fileToObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }

  async function uploadContent(mid: number, type: "pdf" | "video") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "pdf" ? ".pdf,application/pdf" : "video/*";
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const name = file.name || (type === "pdf" ? "Document.pdf" : "Video.mp4");
      const dataUrl = fileToObjectURL(file);
      const duration = type === "video" ? 8 : undefined;
      setModules(prev => prev.map(m => m.id === mid ? { ...m, contents: [...m.contents, { id: Date.now(), type, name, duration, dataUrl }] } : m));
    };
    input.click();
  }

  function deleteContent(mid: number, cid: number) {
    setModules(prev => prev.map(m => m.id === mid ? { ...m, contents: m.contents.filter(c => c.id !== cid), viewed: m.viewed.filter(v => v !== cid), done: false } : m));
  }

  function attachQuiz(mid: number) {
    const title = prompt("Quiz title?")?.trim();
    if (!title) return;
    const q = Number(prompt("How many questions?", "5") || 5);
    setModules(prev => prev.map(m => m.id === mid ? { ...m, quiz: { id: Date.now(), title, questions: q } } : m));
  }

  function takeQuiz(mid: number) {
    const mod = modules.find(m => m.id === mid);
    if (!mod?.quiz) return;
    setNextQuiz({ mid, title: mod.quiz.title, questions: mod.quiz.questions });
  }

  function finishQuiz(mid: number, pass = true) {
    if (!nextQuiz) return;
    if (pass) {
      setModules(prev => prev.map(m => m.id === mid ? { ...m, done: true } : m));
      const title = modules.find(m => m.id === mid)?.title || "Module";
      setCertToast(`${title} – Certificate unlocked!`);
      setTimeout(() => setCertToast(null), 2500);
    }
    setNextQuiz(null);
  }

  const allDoneCount = modules.filter(m => m.done).length;
  const overallPct = Math.round((allDoneCount / modules.length) * 100);

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(m => m.title.toLowerCase().includes(q) || m.info.toLowerCase().includes(q) || m.contents.some(c => c.name.toLowerCase().includes(q)));
  }, [modules, search]);

  const IntroPanel = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal>
      <div className="w-[min(980px,95vw)] rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl px-6 py-4" style={{ background: theme.soft }}>
          <div className="flex items-center gap-2">
            <FolderOpen style={{ color: theme.primary }} className="h-5 w-5" />
            <div className="font-semibold">Rajarani Coaching Introduction</div>
          </div>
          <Button variant="outline" onClick={() => setShowIntro(false)} aria-label="Close introduction">Close</Button>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <Card className="md:col-span-2"><CardHeader><CardTitle>About Us</CardTitle></CardHeader><CardContent className="text-sm text-gray-700">Raja Rani Coaching is India’s leading fashion education platform, empowering thousands to build careers in designing, stitching, and boutique business. From basic skills to professional expertise, we turn dreams into reality through practical, affordable, and industry-driven courses.</CardContent></Card>
          <Card><CardHeader><CardTitle>Our Mission</CardTitle></CardHeader><CardContent className="text-sm text-gray-700">We aim to inspire & empower individuals by unleashing their potential & are committed to transforming lives through quality education & skill development.</CardContent></Card>
          <Card><CardHeader><CardTitle>Our Vision</CardTitle></CardHeader><CardContent className="text-sm text-gray-700">We unite your passion & career together by fostering financial freedom & economic strength through education.</CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><CardTitle>Our Values</CardTitle></CardHeader><CardContent className="text-sm text-gray-700">Happiness • Excellence • Empowerment • Commitment</CardContent></Card>
        </div>
      </div>
    </div>
  );

  const PlayerPanel = ({ mid, cid, progress, playing }: { mid: number; cid: number; progress: number; playing: boolean }) => {
    const mod = modules.find(m => m.id === mid)!;
    const item = mod.contents.find(c => c.id === cid)!;
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;
      const onTime = () => {
        const pct = Math.min(100, Math.round((v.currentTime / (v.duration || item.duration || 1)) * 100));
        setPlayer(p => (p && p.cid === cid ? { ...p, progress: pct } : p));
      };
      const onEnd = () => {
        setPlayer(p => (p && p.cid === cid ? { ...p, progress: 100, playing: false } : p));
        markViewed(mid, cid);
      };
      v.addEventListener("timeupdate", onTime);
      v.addEventListener("ended", onEnd);
      return () => {
        v.removeEventListener("timeupdate", onTime);
        v.removeEventListener("ended", onEnd);
      };
    }, [cid, mid, item.duration]);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" role="dialog" aria-modal>
        <div className="w-[min(980px,95vw)] rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between rounded-t-2xl px-6 py-4" style={{ background: theme.soft }}>
            <div className="font-semibold truncate pr-3">{item.type === "video" ? "Playing" : "Opening"}: {item.name}</div>
            <Button variant="outline" onClick={() => setPlayer(null)} aria-label="Close player">Close</Button>
          </div>
          <div className="space-y-4 p-6 text-sm text-gray-700">
            {item.type === "video" ? (
              <>
                {item.dataUrl ? (
                  <video ref={videoRef} className="w-full max-h-[60vh] rounded-md bg-black" src={item.dataUrl} controls playsInline />
                ) : (
                  <div className="h-48 w-full rounded-md bg-black/5" />
                )}
                <div className="h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full" style={{ width: `${progress}%`, background: theme.primary }} /></div>
                <div className="text-xs text-gray-500" aria-live="polite">{progress}% watched</div>
              </>
            ) : (
              <div className="rounded-xl border overflow-hidden bg-black/2">
                {item.dataUrl ? (
                  <object data={item.dataUrl} type="application/pdf" className="h-[75vh] w-full">
                    <iframe title={item.name} src={item.dataUrl + '#toolbar=1&navpanes=1'} className="h-[75vh] w-full" />
                  </object>
                ) : (
                  <div className="p-4">PDF preview not available</div>
                )}
                {item.dataUrl && (
                  <div className="p-3 flex justify-end bg-white/60">
                    <Button variant="outline" onClick={() => window.open(item.dataUrl!, "_blank")}>Open in new tab</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuizPanel = ({ mid, title, questions }: { mid: number; title: string; questions: number }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal>
      <div className="w-[min(720px,95vw)] rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl px-6 py-4" style={{ background: theme.soft }}>
          <div className="flex items-center gap-2"><BarChart3 style={{ color: theme.primary }} className="h-5 w-5" /><div className="font-semibold">{title} – {questions} Qs</div></div>
          <Button variant="outline" onClick={() => setNextQuiz(null)} aria-label="Close quiz">Close</Button>
        </div>
        <div className="space-y-4 p-6 text-sm text-gray-700">
          <div>Demo quiz: etiquette, tone, response time, call flow, escalation.</div>
          <div className="flex gap-2">
            <Button style={{ background: theme.primary, color: "white" }} onClick={() => finishQuiz(mid, true)}>Submit & Pass</Button>
            <Button variant="outline" onClick={() => finishQuiz(mid, false)}>Submit & Fail</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const NavBtn = ({ label, onClick, hidden }: { label: string; onClick: () => void; hidden?: boolean }) => hidden ? null : (
    <Button variant={nav === label ? "secondary" : "ghost"} className={`w-full justify-start ${nav === label ? "border-l-4" : ""}`} style={nav === label ? { borderColor: theme.accent } : undefined} onClick={onClick}>{label}</Button>
  );

  const uploadLogo = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const dataUrl = fileToObjectURL(file);
      setLogoDataUrl(dataUrl);
    };
    input.click();
  };

  return (
    <div className="min-h-screen text-gray-900" style={{ background: theme.bg }}>
      <header className="sticky top-0 z-40 text-gray-900 shadow-md" style={{ background: `linear-gradient(180deg, ${theme.soft} 0%, #FFFFFF 80%)` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoDataUrl || "https://placehold.co/40x40?text=RR"} alt="Rajarani Coaching logo" className="h-10 w-10 rounded-lg object-contain ring-2" style={{ ringColor: theme.accent as any }} />
            <div>
              <div className="text-lg font-bold tracking-tight" style={{ color: theme.primary }}>Rajarani Coaching</div>
              <div className="-mt-1 text-xs opacity-90">CSR Training LMS</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input className="pl-8 w-64" placeholder="Search modules, templates, FAQs" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search" />
            </div>
            <Tabs value={role} onValueChange={(v: any) => { setRole(v); setNav("Dashboard"); }}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="New Joiner">New Joiner</TabsTrigger>
                <TabsTrigger value="Trainer">Trainer</TabsTrigger>
              </TabsList>
            </Tabs>
            <Avatar><AvatarFallback>RC</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-12" style={{ background: "linear-gradient(180deg, rgba(11,59,60,0.06) 0%, rgba(200,161,51,0.06) 100%)" }}>
        <aside className="md:col-span-3">
          <nav className="sticky top-20 space-y-2">
            <NavBtn label="Dashboard" onClick={() => setNav("Dashboard")} />
            <NavBtn label="Modules" onClick={() => setNav("Modules")} />
            <NavBtn label="Templates" onClick={() => setNav("Templates")} />
            <NavBtn label="FAQs" onClick={() => setNav("FAQs")} />
            <NavBtn label="Quality & SLA" onClick={() => setNav("Quality & SLA")} />
            <NavBtn label="Reports" onClick={() => setNav("Reports")} hidden={role !== "Trainer"} />
            <NavBtn label="Certificates" onClick={() => setNav("Certificates")} />
            <NavBtn label="Settings" onClick={() => setNav("Settings")} />
            <div className="mt-4 md:hidden"><Input placeholder="Search... (modules, templates, FAQs)" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search" /></div>
          </nav>
        </aside>

        <section className="md:col-span-9 space-y-6">
          {nav === "Dashboard" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden" style={{ borderColor: theme.soft }}>
                <CardHeader style={{ background: theme.soft }}>
                  <CardTitle className="flex items-center justify-between font-extrabold tracking-tight"><span>{role === "New Joiner" ? "Welcome to your onboarding" : "Trainer Dashboard"}</span><Badge style={{ backgroundColor: theme.primary, color: "white" }}>{role}</Badge></CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 p-6 md:grid-cols-3">
                  <div className="rounded-2xl border p-4 hover:shadow-md transition cursor-pointer" onClick={() => setShowIntro(true)}>
                    <div className="flex items-center gap-2"><FolderOpen style={{ color: theme.primary }} className="h-5 w-5" /><div className="font-semibold">Rajarani Coaching Introduction</div></div>
                    <div className="mt-2 text-xs text-gray-600">About, Mission, Vision & Values</div>
                    <div className="mt-3 text-[12px]" style={{ color: theme.accent }}>Open folder <ChevronRight className="inline h-3 w-3" /></div>
                  </div>

                  {role === "New Joiner" ? (
                    <div className="rounded-2xl border p-4">
                      <div className="text-sm text-gray-600">Onboarding progress (modules completed)</div>
                      <div className="mt-1 text-3xl font-bold">{overallPct}%</div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full" style={{ width: `${overallPct}%`, background: theme.primary }} /></div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border p-4">
                      <div className="text-sm text-gray-600">Batch completion (demo)</div>
                      <div className="mt-1 text-3xl font-bold">61%</div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full" style={{ width: `61%`, background: theme.primary }} /></div>
                      <div className="mt-2 text-xs text-gray-600">CSR-Nov-2025-A + CSR-Nov-2025-B</div>
                    </div>
                  )}

                  <div className="rounded-2xl border p-4">
                    {role === "New Joiner" ? (
                      <>
                        <div className="font-semibold" style={{ color: theme.primary }}>Next step</div>
                        <div className="text-xs text-gray-600">Open Modules, watch/read 100%, then take quiz</div>
                        <Button className="mt-3" style={{ background: theme.primary, color: "white" }} onClick={() => setNav("Modules")}>Go to Modules</Button>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold" style={{ color: theme.primary }}>Trainer quick actions</div>
                        <div className="text-xs text-gray-600">Create module / Upload content / Attach quiz</div>
                        <div className="mt-3 flex gap-2">
                          <Button onClick={addModule} className="gap-1" style={{ background: theme.primary, color: "white" }}><Plus className="h-4 w-4" /> New Module</Button>
                          <Button variant="outline" onClick={() => setNav("Modules")}>Manage Modules</Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {nav === "Modules" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between"><span>CSR Training Modules</span>{role === "Trainer" && (<div className="flex gap-2"><Button className="gap-1" style={{ background: theme.primary, color: "white" }} onClick={addModule}><Plus className="h-4 w-4" /> Create Module</Button></div>)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredModules.length === 0 && (<div className="text-sm text-gray-600 md:col-span-2 xl:col-span-3">No modules match “{search}”.</div>)}
                {filteredModules.map(m => {
                  const { total, viewed, pct } = moduleProgress(m);
                  return (
                    <div key={m.id} className="rounded-2xl border p-5 bg-white shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-lg" style={{ color: theme.primary }}>{m.title}</div>
                        <Badge variant="secondary">{m.done ? "Completed" : "In Progress"}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-gray-700 font-medium">{m.info}</div>
                      <div className="mt-3 space-y-2">
                        {m.contents.length === 0 && (<div className="text-xs text-gray-700 font-medium">No content uploaded yet.</div>)}
                        {m.contents.map(c => (
                          <div key={c.id} className="flex items-center justify-between rounded-lg border p-2 bg-white">
                            <div className="text-sm">{c.type.toUpperCase()} · {c.name}</div>
                            <div className="flex gap-2">
                              {role === "Trainer" ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setPlayer({ mid: m.id, cid: c.id, progress: c.type === "video" ? 0 : 100, playing: c.type === "video" })}><Eye className="h-4 w-4 mr-1" />Preview</Button>
                                  <Button size="sm" variant="outline" onClick={() => deleteContent(m.id, c.id)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                                </>
                              ) : (
                                <Button size="sm" onClick={() => openContent(m.id, c)}>Open</Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-700 font-medium"><span>Content viewed</span><span>{viewed}/{total}</span></div>
                        <Progress value={pct} />
                      </div>
                      {role === "Trainer" ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" className="gap-1" variant="outline" onClick={() => uploadContent(m.id, "pdf")}><Upload className="h-4 w-4" /> Upload PDF</Button>
                          <Button size="sm" className="gap-1" variant="outline" onClick={() => uploadContent(m.id, "video")}><Upload className="h-4 w-4" /> Upload Video</Button>
                          <Button size="sm" className="gap-1" style={{ borderColor: theme.accent }} variant="outline" onClick={() => attachQuiz(m.id)}><BarChart3 className="h-4 w-4" /> Attach Quiz</Button>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center justify-between">
                          {m.quiz ? (
                            <Button size="sm" disabled={m.viewed.length < m.contents.length || m.done} onClick={() => takeQuiz(m.id)}>{m.done ? "Quiz Passed" : "Take Quiz"}</Button>
                          ) : (
                            <span className="text-xs text-gray-700 font-medium">Quiz will appear after trainer uploads</span>
                          )}
                          <div className="text-xs font-medium" style={{ color: theme.primary }}>{m.done ? "✅ Completed" : ""}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {nav === "Templates" && (
            <Card>
              <CardHeader><CardTitle>Reply Templates</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">{[
                { title: "WhatsApp – Course Info", channel: "WhatsApp" },
                { title: "Instagram – Thank You", channel: "Instagram" },
                { title: "Facebook – Follow‑up", channel: "Facebook" },
                { title: "Support Ticket – Update", channel: "All" }
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3 bg-white"><div><div className="font-medium">{t.title}</div><div className="text-xs text-gray-700 font-medium">Channel: {t.channel}</div></div><Button size="sm" variant="outline" style={{ borderColor: theme.accent }}>Use</Button></div>
              ))}</CardContent>
            </Card>
          )}

          {nav === "FAQs" && (
            <div className="space-y-3">
              {[
                { q: "Fees kitne hai?", a: "Course ke hisaab se vary karta hai. Latest fee sheet templates me diya hai." },
                { q: "Batch kab start hota hai?", a: "Har Monday orientation hota hai. Upcoming schedule Calendar me hai." },
                { q: "Refund policy?", a: "Policy document SOP repo me hai. Summary: 7 days within orientation." }
              ].map((f, i) => (
                <Card key={i} className="hover:shadow-sm transition bg-white"><CardHeader><CardTitle>Q: {f.q}</CardTitle></CardHeader><CardContent className="text-sm text-gray-700">A: {f.a}</CardContent></Card>
              ))}
            </div>
          )}

          {nav === "Quality & SLA" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card><CardHeader><CardTitle>Response Targets (SLA)</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-gray-700"><div>Instagram/FB/YouTube DMs & comments: <b>≤ 30 min</b></div><div>WhatsApp first response: <b>≤ 10 min</b></div><div>Missed call callback: <b>≤ 15 min</b></div></CardContent></Card>
              <Card><CardHeader><CardTitle>Quality Scorecard</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-gray-700"><div>Greeting & Tone · Need Discovery · Clear Solution · Next Steps · Closure</div><Button variant="outline" style={{ borderColor: theme.accent }}>Download Scorecard</Button></CardContent></Card>
            </div>
          )}

          {nav === "Reports" && role === "Trainer" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="flex items-center gap-2">Batch Progress</CardTitle></CardHeader><CardContent className="space-y-3">{[
                { name: "CSR-Nov-2025-A", learners: 24, pct: 64 },
                { name: "CSR-Nov-2025-B", learners: 18, pct: 52 }
              ].map((b, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3 bg-white"><div><div className="font-medium">{b.name}</div><div className="text-xs text-gray-700 font-medium">{b.learners} learners</div></div><div className="w-1/2"><div className="h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full" style={{ width: `${b.pct}%`, background: theme.primary }} /></div></div><Button size="sm" variant="outline">View</Button></div>
              ))}</CardContent></Card>
              <Card><CardHeader><CardTitle>Quiz Analytics</CardTitle></CardHeader><CardContent className="space-y-3">{[
                { title: "Social + WhatsApp", attempts: 28, passRate: 89 },
                { title: "Calls + Sales/Support", attempts: 31, passRate: 84 }
              ].map((q, i) => (
                <div key={i} className="rounded-lg border p-3 bg-white"><div className="font-medium">{q.title}</div><div className="text-xs text-gray-700 font-medium">{q.attempts} attempts</div><div className="mt-2 flex items-center gap-3"><div className="text-2xl font-bold">{q.passRate}%</div><span className="text-xs text-gray-700 font-medium">pass rate</span></div><Button size="sm" variant="outline" className="mt-2">Export CSV</Button></div>
              ))}</CardContent></Card>
            </div>
          )}

          {nav === "Certificates" && (
            <Card><CardHeader><CardTitle>Certificates</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{modules.filter(m => m.done).length === 0 ? (<div className="text-sm text-gray-700">Complete a module quiz to unlock certificates.</div>) : (modules.filter(m => m.done).map(m => (<div key={m.id} className="flex items-center justify-between rounded-lg border p-3 bg-white"><div className="flex items-center gap-2"><Award style={{ color: theme.primary }} className="h-4 w-4" /><div className="font-medium">{m.title} – Certificate</div></div><div className="flex gap-2"><Button size="sm" variant="outline">View</Button><Button size="sm" style={{ background: theme.primary, color: "white" }}>Download</Button></div></div>)))}</CardContent></Card>
          )}

          {nav === "Settings" && (
            <Card><CardHeader><CardTitle>Brand & Profile</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><div className="text-sm font-medium">Rajarani Logo</div><div className="flex items-center gap-3"><img src={logoDataUrl || "https://placehold.co/60x60?text=RR"} className="h-12 w-12 rounded-md object-contain ring-2" style={{ ringColor: theme.accent as any }} /><Button variant="outline" onClick={uploadLogo}>Upload Logo</Button></div><div className="text-xs text-gray-500">Logo persists locally (browser storage). You can also set window.RAJARANI_LOGO_URL globally.</div></div><Input placeholder="Full name" defaultValue="Ayesha Khan" /><Input placeholder="Email" defaultValue="ayesha@rajarani.co" /><Button style={{ background: theme.primary, color: "white" }}>Save</Button></CardContent></Card>
          )}
        </section>
      </main>

      <footer className="border-t py-3 text-center text-sm text-gray-600 bg-white">© {new Date().getFullYear()} Rajarani Coaching · Training for Excellence in CSR Communication</footer>

      {showIntro && <IntroPanel />}
      {player && <PlayerPanel {...player} />}
      {nextQuiz && <QuizPanel mid={nextQuiz.mid} title={nextQuiz.title} questions={nextQuiz.questions} />}

      {certToast && (<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs text-white shadow-lg">{certToast}</div>)}
    </div>
  );
}
