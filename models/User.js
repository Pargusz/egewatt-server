import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Store as StoreIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    aboneNo: "",
    phone: "",
  });
  const [dealerForm, setDealerForm] = useState({
    name: "",
    dealerCode: "",
    email: "",
    password: "",
    selectedProfileId: "",
  });
  const [profiles, setProfiles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // 🔐 Admin kontrolü
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!token) navigate("/login");
    else if (role !== "admin") navigate("/dashboard");
  }, [navigate, token]);

  // 🔁 Veri çekme
  const fetchCustomers = async () => {
    try {
      const res = await api.get("/admin/list-customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.customers || [];
      setCustomers(list);
      setFiltered(list);
    } catch (err) {
      console.error("❌ Müşteri listesi alınamadı:", err);
      setError("❌ Müşteri listesi alınamadı.");
    }
  };

  const fetchDealers = async () => {
    try {
      const res = await api.get("/dealer/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.ok) setDealers(res.data.dealers);
    } catch (err) {
      console.error("Bayi listesi alınamadı:", err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await api.get("/aril/profiles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfiles(res.data.profiles || []);
    } catch (err) {
      console.error("ARIL profilleri alınamadı:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchDealers();
    fetchProfiles();
  }, []);

  // 🔄 Otomatik yenileme
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCustomers();
      fetchDealers();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔤 Form değişikliği
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleDealerChange = (e) => setDealerForm({ ...dealerForm, [e.target.name]: e.target.value });

  const validatePhone = (phone) => /^\+90\d{10}$/.test(phone.trim());

  // 🧩 Yeni müşteri oluştur
  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validatePhone(form.phone))
      return setError("Geçerli bir telefon numarası girin (+905xx...).");
    if (!form.aboneNo.trim()) return setError("Abone numarası boş olamaz.");

    const subscriptions = form.aboneNo
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      await api.post(
        "/admin/create-customer",
        { ...form, subscriptions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Yeni müşteri oluşturuldu.");
      setForm({ username: "", email: "", password: "", aboneNo: "", phone: "" });
      await fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || "❌ Müşteri oluşturulamadı.");
    }
  };

  // 🧩 Yeni bayi oluştur
  const handleSubmitDealer = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/dealer/create", dealerForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await api.post(
        "/admin/create-customer",
        {
          username: dealerForm.name,
          email: dealerForm.email,
          password: dealerForm.password,
          subscriptions: [],
          phone: "+900000000000",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`✅ Bayi oluşturuldu: ${dealerForm.name}`);
      setDealerForm({
        name: "",
        dealerCode: "",
        email: "",
        password: "",
        selectedProfileId: "",
      });

      await fetchDealers();
      await fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || "❌ Bayi oluşturulamadı.");
    }
  };

  // 🗑️ Bayi silme
  const handleDeleteDealer = async () => {
    if (!selectedDealer) return;
    try {
      await api.delete(`/dealer/delete/${selectedDealer._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`🗑️ Bayi silindi: ${selectedDealer.name}`);
      setDeleteDialog(false);
      setSelectedDealer(null);
      await fetchDealers();
      await fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || "❌ Bayi silinemedi.");
    }
  };

  // 🔍 Arama
  useEffect(() => {
    if (!searchTerm.trim()) setFiltered(customers);
    else {
      const term = searchTerm.toLowerCase();
      setFiltered(
        customers.filter(
          (c) =>
            c.username?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.phone?.includes(term)
        )
      );
    }
  }, [searchTerm, customers]);

  // 📤 Excel dışa aktar
  const handleExport = () => {
    const data = filtered.map((c) => ({
      "Kullanıcı Adı": c.username,
      Email: c.email,
      Telefon: c.phone,
      Abonelikler: Array.isArray(c.subscriptions)
        ? c.subscriptions.join(", ")
        : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Müşteriler");
    XLSX.writeFile(wb, "musteriler.xlsx");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" align="center" fontWeight={700} sx={{ mb: 4 }}>
        🧩 Yönetim Paneli
      </Typography>

      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)} centered>
          <Tab label="Müşteri Yönetimi" icon={<PersonAddIcon />} iconPosition="start" />
          <Tab label="Bayi Yönetimi" icon={<StoreIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* 🧍 MÜŞTERİ YÖNETİMİ */}
      {tab === 0 && (
        <>
          <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }}>
            <Typography variant="h6" mb={2}>
              Yeni Müşteri Oluştur
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmitCustomer}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField label="Kullanıcı Adı" name="username" value={form.username} onChange={handleChange} required />
              <TextField label="Email" name="email" value={form.email} onChange={handleChange} required />
              <TextField label="Şifre" name="password" type="password" value={form.password} onChange={handleChange} required />
              <TextField label="Telefon (+90)" name="phone" value={form.phone} onChange={handleChange} required />
              <TextField label="Abone Numarası" name="aboneNo" value={form.aboneNo} onChange={handleChange} required />
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button type="submit" variant="contained" fullWidth sx={{ py: 1.3, borderRadius: 2 }}>
                  Oluştur
                </Button>
              </motion.div>
            </Box>
            {message && <Alert severity="success" sx={{ mt: 3 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
          </Paper>

          <Paper sx={{ p: 3, mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
            <SearchIcon />
            <TextField placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} fullWidth size="small" />
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
              Dışa Aktar
            </Button>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ad</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Telefon</TableCell>
                    <TableCell>Aboneler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        {Array.isArray(user.subscriptions)
                          ? user.subscriptions.join(", ")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* 🧭 BAYİ YÖNETİMİ */}
      {tab === 1 && (
        <>
          <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }}>
            <Typography variant="h6" mb={2}>
              Yeni Bayi Oluştur
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmitDealer}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField label="Bayi Adı" name="name" value={dealerForm.name} onChange={handleDealerChange} required />
              <TextField label="Bayi Kodu" name="dealerCode" value={dealerForm.dealerCode} onChange={handleDealerChange} required />
              <TextField label="E-posta" name="email" value={dealerForm.email} onChange={handleDealerChange} required />
              <TextField label="Portal Giriş Şifresi" name="password" type="password" value={dealerForm.password} onChange={handleDealerChange} required />
              <FormControl fullWidth>
                <InputLabel id="aril-profile-label">ARIL Profili Seç</InputLabel>
                <Select
                  labelId="aril-profile-label"
                  name="selectedProfileId"
                  value={dealerForm.selectedProfileId}
                  label="ARIL Profili Seç"
                  onChange={handleDealerChange}
                  required
                >
                  {profiles.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button type="submit" variant="contained" fullWidth sx={{ py: 1.3, borderRadius: 2 }}>
                  Bayi Oluştur
                </Button>
              </motion.div>
            </Box>
            {message && <Alert severity="success" sx={{ mt: 3 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" mb={2}>
              Kayıtlı Bayiler
            </Typography>
            {dealers.length === 0 && <Typography color="text.secondary">Henüz kayıtlı bayi yok.</Typography>}
            {dealers.map((d) => (
              <Paper
                key={d._id}
                sx={{
                  p: 2,
                  mb: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: 2,
                  backgroundColor: "#fafafa",
                  border: "1px solid #ddd",
                }}
              >
                <Box>
                  <Typography fontWeight={600}>{d.name}</Typography>
                  <Typography color="text.secondary">{d.dealerCode}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography color="text.secondary">{d.email}</Typography>
                  <Button
                    color="error"
                    onClick={() => {
                      setSelectedDealer(d);
                      setDeleteDialog(true);
                    }}
                    startIcon={<DeleteIcon />}
                    size="small"
                  >
                    Sil
                  </Button>
                </Box>
              </Paper>
            ))}
          </Paper>
        </>
      )}

      {/* 🧨 Silme Onay Diyaloğu */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>
          {selectedDealer ? `${selectedDealer.name} bayisini silmek istiyor musun?` : ""}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>İptal</Button>
          <Button color="error" onClick={handleDeleteDealer}>
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
