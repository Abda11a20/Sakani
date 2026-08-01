// apps/frontend/src/app/[locale]/dev/ui/page.tsx
"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  PasswordInput,
  CurrencyInput,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Card,
  Badge,
  Avatar,
  Modal,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { typography } from "@/lib/design/tokens";
import { Heart, Mail, Moon, Sun, Globe, Layers, Layout, Type, Palette, Sliders, Eye } from "lucide-react";

type TabType = "buttons" | "inputs" | "cards" | "badges" | "modals" | "typography" | "colors";

export default function UIShowcasePage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("buttons");
  const [modalOpen, setModalOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [selectValue, setSelectValue] = useState("1");
  const [interactiveDisabled, setInteractiveDisabled] = useState(false);
  const [interactiveLoading, setInteractiveLoading] = useState(false);
  const [dir, setDir] = useState<"rtl" | "ltr">("rtl");

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "buttons", label: "Buttons", icon: <Sliders className="h-4 w-4" /> },
    { id: "inputs", label: "Inputs & Forms", icon: <Type className="h-4 w-4" /> },
    { id: "cards", label: "Cards", icon: <Layout className="h-4 w-4" /> },
    { id: "badges", label: "Badges & Avatars", icon: <Layers className="h-4 w-4" /> },
    { id: "modals", label: "Modals", icon: <Eye className="h-4 w-4" /> },
    { id: "typography", label: "Typography & Spacing", icon: <Type className="h-4 w-4" /> },
    { id: "colors", label: "Design Tokens (Colors)", icon: <Palette className="h-4 w-4" /> },
  ];

  return (
    <main className="min-h-screen bg-surface-secondary p-4 md:p-8 font-cairo text-text transition-colors duration-200" dir={dir}>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Sticky Control Bar */}
        <header className="sticky top-4 z-50 rounded-2xl border border-border bg-surface/90 p-4 backdrop-blur-md shadow-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-primary">Sakani UI Developer Playground</h1>
            <p className="text-xs text-text-secondary">Interactive Testing Suite & Tabbed Story Showcase</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDir(dir === "rtl" ? "ltr" : "rtl")}
              leftIcon={<Globe className="h-4 w-4" />}
            >
              {dir.toUpperCase()}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              leftIcon={resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4" />}
            >
              {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </header>

        {/* State Controllers */}
        <Card className="p-4 bg-surface flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6 items-center">
            <span className="text-xs font-bold text-text-secondary uppercase">Playground Toggles:</span>
            <Switch
              label="Disabled State"
              checked={interactiveDisabled}
              onChange={(e) => setInteractiveDisabled(e.target.checked)}
            />
            <Switch
              label="Loading State"
              checked={interactiveLoading}
              onChange={(e) => setInteractiveLoading(e.target.checked)}
            />
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              leftIcon={tab.icon}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* TAB 1: BUTTONS */}
        {activeTab === "buttons" && (
          <section className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Variants</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary" disabled={interactiveDisabled} loading={interactiveLoading}>Primary</Button>
                  <Button variant="secondary" disabled={interactiveDisabled} loading={interactiveLoading}>Secondary</Button>
                  <Button variant="accent" disabled={interactiveDisabled} loading={interactiveLoading}>Accent Gold</Button>
                  <Button variant="outline" disabled={interactiveDisabled} loading={interactiveLoading}>Outline</Button>
                  <Button variant="ghost" disabled={interactiveDisabled} loading={interactiveLoading}>Ghost</Button>
                  <Button variant="danger" disabled={interactiveDisabled} loading={interactiveLoading}>Danger</Button>
                  <Button variant="success" disabled={interactiveDisabled} loading={interactiveLoading}>Success</Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Sizes & Icons</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button size="sm" disabled={interactiveDisabled}>Small (sm)</Button>
                  <Button size="md" disabled={interactiveDisabled}>Medium (md)</Button>
                  <Button size="lg" disabled={interactiveDisabled}>Large (lg)</Button>
                  <Button leftIcon={<Mail className="h-4 w-4" />} disabled={interactiveDisabled}>Left Icon</Button>
                  <Button rightIcon={<Heart className="h-4 w-4" />} disabled={interactiveDisabled}>Right Icon</Button>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* TAB 2: INPUTS */}
        {activeTab === "inputs" && (
          <section className="space-y-4">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Standard Input" placeholder="أدخل النص هنا..." leftIcon={<Mail className="h-4 w-4" />} disabled={interactiveDisabled} />
                <Input label="Input with Error" placeholder="example@domain.com" error="بريد إلكتروني غير صحيح" disabled={interactiveDisabled} />
                <PasswordInput label="Password Input" placeholder="••••••••" disabled={interactiveDisabled} />
                <CurrencyInput label="Currency Input" placeholder="5000" disabled={interactiveDisabled} />
                <div className="md:col-span-2">
                  <Textarea label="Textarea Component" placeholder="ملاحظات الإعلان..." disabled={interactiveDisabled} />
                </div>
                <Select
                  label="Select Component"
                  options={[{ value: "1", label: "شقة للإيجار" }, { value: "2", label: "غرفة مشتركة" }]}
                  value={selectValue}
                  onValueChange={setSelectValue}
                  disabled={interactiveDisabled}
                />
                <div className="space-y-4 pt-2">
                  <Checkbox label="موافق على الشروط والسياسات" checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} disabled={interactiveDisabled} />
                  <Switch label="استلام الإشعارات البريدية" checked={switchChecked} onChange={(e) => setSwitchChecked(e.target.checked)} disabled={interactiveDisabled} />
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* TAB 3: CARDS */}
        {activeTab === "cards" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="default">
                <Card.Header>
                  <h3 className="font-bold text-base">Card.Header Component</h3>
                  <p className="text-xs text-text-secondary">Compound Component Pattern</p>
                </Card.Header>
                <Card.Body>
                  <p className="text-sm">Sub-components: <code className="text-xs bg-surface-tertiary px-1 rounded">Card.Header</code>, <code className="text-xs bg-surface-tertiary px-1 rounded">Card.Body</code>, <code className="text-xs bg-surface-tertiary px-1 rounded">Card.Footer</code>.</p>
                </Card.Body>
                <Card.Footer className="justify-between">
                  <Badge color="success">نشط</Badge>
                  <Button size="sm">تعديل</Button>
                </Card.Footer>
              </Card>

              <Card variant="elevated">
                <Card.Body className="space-y-2">
                  <h3 className="font-bold text-base">Elevated Card</h3>
                  <p className="text-xs text-text-secondary">Elevated shadow variant for feature cards.</p>
                  <div className="flex gap-2">
                    <Badge color="gold">VIP</Badge>
                    <Badge color="info">إعلان</Badge>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </section>
        )}

        {/* TAB 4: BADGES & AVATARS */}
        {activeTab === "badges" && (
          <section className="space-y-4">
            <Card className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge color="default">Default</Badge>
                <Badge color="success">Success</Badge>
                <Badge color="warning">Warning</Badge>
                <Badge color="danger">Danger</Badge>
                <Badge color="info">Info</Badge>
                <Badge color="gold">Gold</Badge>
              </div>
              <div className="flex items-center gap-4">
                <Avatar name="أحمد علي" size="xs" />
                <Avatar name="سارة خليل" size="sm" />
                <Avatar name="محمد محمود" size="md" verified />
                <Avatar name="عمر الشريف" size="lg" verified />
                <Avatar name="فاطمة حسن" size="xl" />
              </div>
            </Card>
          </section>
        )}

        {/* TAB 5: MODALS */}
        {activeTab === "modals" && (
          <section className="space-y-4">
            <Card className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Interactive Radix Modal</h3>
                <p className="text-xs text-text-secondary">Accessible Dialog with focus trapping & Esc exit.</p>
              </div>
              <Button onClick={() => setModalOpen(true)}>تجربة النافذة</Button>
              <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="نافذة تفاعلية" description="مثال لمكون Modal يعتمد على Radix Dialog.">
                <p className="py-4 text-sm text-text-secondary">يمكن وضع أي نموذج أو محتوى داخل مكون Modal بسهولة.</p>
                <div className="flex justify-end gap-3 pt-3 border-t border-divider">
                  <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>إلغاء</Button>
                  <Button size="sm" onClick={() => setModalOpen(false)}>حفظ</Button>
                </div>
              </Modal>
            </Card>
          </section>
        )}

        {/* TAB 6: TYPOGRAPHY */}
        {activeTab === "typography" && (
          <section className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="border-b border-divider pb-3">
                <span className="text-xs text-text-secondary uppercase font-bold">Display Scale (36px)</span>
                <p className={typography.scale.display}>العقارات المتاحة للإيجار في القاهرة</p>
              </div>
              <div className="border-b border-divider pb-3">
                <span className="text-xs text-text-secondary uppercase font-bold">Heading Scale (24px)</span>
                <h2 className={typography.scale.heading}>تفاصيل الشقة والخدمات المتاحة</h2>
              </div>
              <div className="border-b border-divider pb-3">
                <span className="text-xs text-text-secondary uppercase font-bold">Title Scale (18px)</span>
                <h3 className={typography.scale.title}>معلومات المستأجر ورقم الهاتف</h3>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase font-bold">Body Scale (16px)</span>
                <p className={typography.scale.body}>شقة مفروشة بالكامل قريبة من مترو الأنفاق تحتوي على 3 غرف ونظام تكييف حديث.</p>
              </div>
            </Card>
          </section>
        )}

        {/* TAB 7: COLORS */}
        {activeTab === "colors" && (
          <section className="space-y-4">
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <div className="h-12 w-full rounded-lg bg-primary" />
                  <span className="text-xs font-semibold block text-text">Primary (#1B4F8A)</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-12 w-full rounded-lg bg-accent" />
                  <span className="text-xs font-semibold block text-text">Accent Gold (#D4A847)</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-12 w-full rounded-lg bg-status-success" />
                  <span className="text-xs font-semibold block text-text">Success (#16A34A)</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-12 w-full rounded-lg bg-status-danger" />
                  <span className="text-xs font-semibold block text-text">Danger (#DC2626)</span>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
