// // import { createFileRoute } from '@tanstack/react-router';
// // import { AppLayout } from '@/components/AppLayout';
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { Label } from '@/components/ui/label';
// // import { api } from '@/lib/api';
// // import { useState, useEffect } from 'react';
// // import { Loader2, Store } from 'lucide-react';

// // export const Route = createFileRoute('/settings')({ component: SettingsPage });

// // function SettingsPage() {
// //   const [form, setForm] = useState({
// //     shopName: '', ownerName: '', phone: '',
// //     gstin: '', address: '', city: '', state: '', pincode: '',
// //   });
// //   const [loading, setLoading]   = useState(true);
// //   const [saving, setSaving]     = useState(false);
// //   const [message, setMessage]   = useState('');

// //   useEffect(() => {
// //     api.request('/shop/profile').then(res => {
// //       if (res.ok) {
// //         const d = res.data;
// //         console.log('Shop profile data:', d);
// //         setForm({
// //           shopName: d.shop_name || '', ownerName: d.owner_name || '',
// //           phone: d.phone || '', gstin: d.gstin || '',
// //           address: d.address || '', city: d.city || '',
// //           state: d.state || '', pincode: d.pincode || '',
// //         });
// //       }
// //       setLoading(false);
// //     });
// //   }, []);

// //   const handleSave = async () => {
// //     setSaving(true);
// //     setMessage('');
// //     const res = await api.request('/shop/profile', {
// //       method: 'PUT',
// //       body: JSON.stringify(form),
// //     });
// //     setSaving(false);
// //     setMessage(res.ok ? '✅ Profile saved successfully' : `❌ ${res.error}`);

// //     // Update the shop name in localStorage
// //     if (res.ok) {
// //       const shop = JSON.parse(localStorage.getItem('currentShop') || '{}');
// //       localStorage.setItem('currentShop', JSON.stringify({ ...shop, shopName: form.shopName }));
// //     }
// //   };

// //   if (loading) return <AppLayout><div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;

// //   return (
// //     <AppLayout>
// //       <div className="space-y-6 max-w-2xl">
// //         <div>
// //           <h1 className="text-3xl font-heading font-bold gold-text">Shop Settings</h1>
// //           <p className="text-muted-foreground">Your details appear on all invoices</p>
// //         </div>

// //         <Card className="glass-card">
// //           <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Shop Profile</CardTitle></CardHeader>
// //           <CardContent className="grid gap-4">
// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="grid gap-2">
// //                 <Label>Shop Name *</Label>
// //                 <Input value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} />
// //               </div>
// //               <div className="grid gap-2">
// //                 <Label>Owner Name</Label>
// //                 <Input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
// //               </div>
// //             </div>
// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="grid gap-2">
// //                 <Label>Phone</Label>
// //                 <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
// //               </div>
// //               <div className="grid gap-2">
// //                 <Label>GSTIN</Label>
// //                 <Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} placeholder="33XXXXXXXXX1ZX" />
// //               </div>
// //             </div>
// //             <div className="grid gap-2">
// //               <Label>Address</Label>
// //               <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
// //             </div>
// //             <div className="grid grid-cols-3 gap-4">
// //               <div className="grid gap-2">
// //                 <Label>City</Label>
// //                 <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
// //               </div>
// //               <div className="grid gap-2">
// //                 <Label>State</Label>
// //                 <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
// //               </div>
// //               <div className="grid gap-2">
// //                 <Label>Pincode</Label>
// //                 <Input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
// //               </div>
// //             </div>

// //             {message && <p className="text-sm font-medium">{message}</p>}

// //             <Button onClick={handleSave} disabled={saving} className="w-fit">
// //               {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
// //               Save Profile
// //             </Button>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </AppLayout>
// //   );
// // }

// import { createFileRoute } from '@tanstack/react-router';
// import { AppLayout } from '@/components/AppLayout';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { api } from '@/lib/api';
// import { useState, useEffect } from 'react';
// import { Loader2, Store } from 'lucide-react';
// import { profileStore } from '@/lib/store';

// export const Route = createFileRoute('/settings')({ component: SettingsPage });

// const EMPTY_FORM = {
//   shopName: '', ownerName: '', phone: '',
//   gstin: '', address: '', city: '', state: '', pincode: '',
// };

// function SettingsPage() {
//   const [form, setForm]       = useState(EMPTY_FORM);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving]   = useState(false);
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//      api.request('/shop/profile').then(res => {
//     //  profileStore.get().then(res => {
//       // Guard: only hydrate form when the response is OK *and* data is a
//       // non-null object.  A 404 (new shop, no profile yet) returns res.ok =
//       // false or res.data = undefined — both are safe to ignore here.
//       if (res.ok && res.data && typeof res.data === 'object') {
//         const d = res.data;
//         setForm({
//           shopName:  d.shop_name  || '',
//           ownerName: d.owner_name || '',
//           phone:     d.phone      || '',
//           gstin:     d.gstin      || '',
//           address:   d.address    || '',
//           city:      d.city       || '',
//           state:     d.state      || '',
//           pincode:   d.pincode    || '',
//         });
//       }
//       setLoading(false);
//     }).catch(() => {
//       // Network / parse errors must not leave the page stuck on the spinner.
//       setLoading(false);
//     });
//   }, []);

//   const handleSave = async () => {
//     setSaving(true);
//     setMessage('');
//     const res = await api.request('/shop/profile', {
//       method: 'PUT',
//       body: JSON.stringify(form),
//     });
//     setSaving(false);
//     setMessage(res.ok ? '✅ Profile saved successfully' : `❌ ${res.error ?? 'Save failed'}`);

//     if (res.ok) {
//       const shop = JSON.parse(localStorage.getItem('currentShop') || '{}');
//       localStorage.setItem('currentShop', JSON.stringify({ ...shop, shopName: form.shopName }));
//     }
//   };

//   if (loading) {
//     return (
//       <AppLayout>
//         <div className="flex h-96 items-center justify-center">
//           <Loader2 className="h-8 w-8 animate-spin" />
//         </div>
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout>
//       <div className="space-y-6 max-w-2xl">
//         <div>
//           <h1 className="text-3xl font-heading font-bold gold-text">Shop Settings</h1>
//           <p className="text-muted-foreground">Your details appear on all invoices</p>
//         </div>

//         <Card className="glass-card">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Store className="h-5 w-5" /> Shop Profile
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="grid gap-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="grid gap-2">
//                 <Label>Shop Name *</Label>
//                 <Input
//                   value={form.shopName}
//                   onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label>Owner Name</Label>
//                 <Input
//                   value={form.ownerName}
//                   onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="grid gap-2">
//                 <Label>Phone</Label>
//                 <Input
//                   value={form.phone}
//                   onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label>GSTIN</Label>
//                 <Input
//                   value={form.gstin}
//                   onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))}
//                   placeholder="33XXXXXXXXX1ZX"
//                 />
//               </div>
//             </div>

//             <div className="grid gap-2">
//               <Label>Address</Label>
//               <Input
//                 value={form.address}
//                 onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
//               />
//             </div>

//             <div className="grid grid-cols-3 gap-4">
//               <div className="grid gap-2">
//                 <Label>City</Label>
//                 <Input
//                   value={form.city}
//                   onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label>State</Label>
//                 <Input
//                   value={form.state}
//                   onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label>Pincode</Label>
//                 <Input
//                   value={form.pincode}
//                   onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
//                 />
//               </div>
//             </div>

//             {message && <p className="text-sm font-medium">{message}</p>}

//             <Button onClick={handleSave} disabled={saving} className="w-fit">
//               {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Save Profile
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     </AppLayout>
//   );
// }


import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Loader2, Store } from 'lucide-react';
import { profileStore } from '@/lib/store';

export const Route = createFileRoute('/settings')({ component: SettingsPage });

const EMPTY_FORM = {
  shopName: '', ownerName: '', phone: '',
  gstin: '', address: '', city: '', state: '', pincode: '',
};

function SettingsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.request('/shop/profile').then(res => {
      //  profileStore.get().then(res => {
      // Guard: only hydrate form when the response is OK *and* data is a
      // non-null object.  A 404 (new shop, no profile yet) returns res.ok =
      // false or res.data = undefined — both are safe to ignore here.
      if (res.ok && res.data && typeof res.data === 'object') {
        const d = res.data;
        setForm({
          shopName: d.shop_name || '',
          ownerName: d.owner_name || '',
          phone: d.phone || '',
          gstin: d.gstin || '',
          address: d.address || '',
          city: d.city || '',
          state: d.state || '',
          pincode: d.pincode || '',
        });
      }
      setLoading(false);
    }).catch(() => {
      // Network / parse errors must not leave the page stuck on the spinner.
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const res = await api.request('/shop/profile', {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMessage(res.ok ? '✅ Profile saved successfully' : `❌ ${res.error ?? 'Save failed'}`);

    if (res.ok) {
      const shop = JSON.parse(localStorage.getItem('currentShop') || '{}');
      localStorage.setItem('currentShop', JSON.stringify({ ...shop, shopName: form.shopName }));
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-heading font-bold gold-text">Shop Settings</h1>
          <p className="text-muted-foreground">Your details appear on all invoices</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" /> Shop Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Shop Name *</Label>
                <Input
                  value={form.shopName}
                  onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Owner Name</Label>
                <Input
                  value={form.ownerName}
                  onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>GSTIN</Label>
                <Input
                  value={form.gstin}
                  onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))}
                  placeholder="33XXXXXXXXX1ZX"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Pincode</Label>
                <Input
                  value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                />
              </div>
            </div>

            {message && <p className="text-sm font-medium">{message}</p>}

            <Button onClick={handleSave} disabled={saving} className="w-fit">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}