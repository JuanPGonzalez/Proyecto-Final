import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { MapPin, Truck, Store, Calculator, ChevronRight, Home, Edit3 } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { showAlert } from '../utils/swal';

export default function Envios() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [address, setAddress] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState('');
  const [selectedLocalidad, setSelectedLocalidad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [precioEnvio, setPrecioEnvio] = useState(0);
  const [method, setMethod] = useState('standard');
  const [useSavedAddress, setUseSavedAddress] = useState(false);

  const [provinces, setProvinces] = useState(null);
  const [localidades, setLocalidades] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [error, setError] = useState(null);

  const cart = getStorageItem('cart', []);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUser(res.data);
        if (res.data.direccion && res.data.direccion !== 'Desconocida') {
          setUseSavedAddress(true);
          setAddress(res.data.direccion);
        }
      })
      .catch(err => console.error('Error fetching profile:', err));
    }

    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await axios.get('http://localhost:5000/api/shipping/provinces');
        if (res.data?.ok) {
          setProvinces(res.data?.provinces || []);
        } else {
          setError('Error al cargar provincias');
        }
      } catch (err) {
        setError('Error al cargar provincias');
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  const fetchLocalidades = async (provinciaId) => {
    if (!provinciaId) {
      setLocalidades([]);
      return;
    }
    setLoadingLocalities(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/shipping/localidades/${provinciaId}`);
      if (res.data?.ok) {
        setLocalidades(res.data?.localidades || []);
      }
    } catch (err) {
      console.error('FETCH LOCALIDADES ERROR:', err);
    } finally {
      setLoadingLocalities(false);
    }
  };

  const handleContinue = () => {
    if (method !== 'tienda') {
      if (!address || !selectedProvincia || !selectedLocalidad) {
        return showAlert('Datos incompletos', 'Por favor ingresa todos los datos de envío (dirección, provincia, localidad).', 'warning');
      }
    }

    const provName = Array.isArray(provinces) ? provinces.find(p => Number(p.id) === Number(selectedProvincia))?.nombre : '';
    const locName = Array.isArray(localidades) ? localidades.find(l => Number(l.id) === Number(selectedLocalidad))?.nombre : '';

    setStorageItem('last_shipping', {
      address,
      provincia: provName || '',
      localidad: locName || '',
      localidadId: selectedLocalidad,
      codigoPostal,
      method,
      cost: method === 'tienda' ? 0 : precioEnvio
    });
    navigate('/pago');
  };

  if (!provinces) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando sistema de envío...</div>;

  const provinciaOptions = Array.isArray(provinces) ? provinces.map(p => ({
    value: p.id,
    label: p.nombre
  })) : [];

  const localidadOptions = Array.isArray(localidades) ? localidades.map(l => ({
    value: l.id,
    label: `${l.nombre} (${l.codigo_postal})`
  })) : [];

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
      padding: '5px'
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--card)',
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'var(--accent)' : 'transparent',
      color: state.isFocused ? '#ffffff' : 'var(--foreground)',
      cursor: 'pointer'
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--foreground)',
      fontWeight: 600
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--muted-foreground)'
    })
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Configuración de Envío</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '40px', textAlign: 'center' }}>Selecciona tu ubicación para calcular el costo de envío.</p>

        {error && <div style={{ color: 'var(--error)', textAlign: 'center', marginBottom: '20px', fontWeight: 600 }}>{error}</div>}

        <div className="card" style={{ padding: '30px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '10px' }}>
            <ShipOption
              id="standard"
              title="Envío a Domicilio"
              desc="Cálculo dinámico"
              icon={<Truck size={24} />}
              selected={method === 'standard'}
              onClick={() => setMethod('standard')}
            />
            <ShipOption
              id="tienda"
              title="Retiro en Tienda"
              desc="Zeballos 1315, Rosario"
              icon={<Store size={24} />}
              selected={method === 'tienda'}
              onClick={() => setMethod('tienda')}
            />
          </div>

          {method !== 'tienda' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {user?.direccion && user.direccion !== 'Desconocida' && (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button 
                    onClick={() => {
                      setUseSavedAddress(true);
                      setAddress(user.direccion);
                    }}
                    style={{ 
                      flex: 1, padding: '15px', borderRadius: '12px', border: useSavedAddress ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: useSavedAddress ? 'oklch(0.627 0.194 259.215 / 5%)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: '0.2s'
                    }}
                  >
                    <Home size={20} color={useSavedAddress ? 'var(--accent)' : 'var(--muted-foreground)'} />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: useSavedAddress ? 'var(--accent)' : 'inherit' }}>Usar dirección guardada</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{user.direccion}</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      setUseSavedAddress(false);
                      setAddress('');
                    }}
                    style={{ 
                      flex: 1, padding: '15px', borderRadius: '12px', border: !useSavedAddress ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: !useSavedAddress ? 'oklch(0.627 0.194 259.215 / 5%)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: '0.2s'
                    }}
                  >
                    <Edit3 size={20} color={!useSavedAddress ? 'var(--accent)' : 'var(--muted-foreground)'} />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: !useSavedAddress ? 'var(--accent)' : 'inherit' }}>Usar otra dirección</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Ingresar manualmente</p>
                    </div>
                  </button>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Dirección de Entrega</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Calle y número, Piso, Depto"
                    style={{ paddingLeft: '45px' }}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    disabled={useSavedAddress}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Provincia</label>
                  <Select
                    options={provinciaOptions}
                    placeholder="Buscar provincia..."
                    isSearchable={true}
                    isClearable={true}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    maxMenuHeight={250}
                    styles={{
                      ...customStyles,
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({ ...base, zIndex: 9999 })
                    }}
                    isLoading={loadingProvinces}
                    onChange={(selected) => {
                      if (!selected) {
                        setSelectedProvincia('');
                        setSelectedLocalidad('');
                        setCodigoPostal('');
                        setPrecioEnvio(0);
                        setLocalidades([]);
                        return;
                      }
                      setSelectedProvincia(selected.value);
                      setSelectedLocalidad('');
                      setCodigoPostal('');
                      setPrecioEnvio(0);
                      fetchLocalidades(selected.value);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Localidad</label>
                  <Select
                    options={localidadOptions}
                    placeholder="Buscar localidad..."
                    isSearchable={true}
                    isClearable={true}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    maxMenuHeight={250}
                    styles={{
                      ...customStyles,
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({ ...base, zIndex: 9999 })
                    }}
                    isDisabled={!selectedProvincia}
                    isLoading={loadingLocalities}
                    onChange={(selected) => {
                      if (!selected) {
                        setSelectedLocalidad('');
                        setCodigoPostal('');
                        setPrecioEnvio(0);
                        return;
                      }
                      const loc = Array.isArray(localidades)
                        ? localidades.find(l => Number(l.id) === Number(selected.value))
                        : null;
                      if (!loc) return;
                      setSelectedLocalidad(loc.id);
                      setCodigoPostal(loc.codigo_postal || '');
                      setPrecioEnvio(Number(loc.precio_envio || 0));
                    }}
                  />
                </div>
              </div>

              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Código Postal</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Se autocompleta al elegir localidad"
                  value={codigoPostal}
                  readOnly
                  style={{ backgroundColor: 'var(--secondary)', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Calculator size={20} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Costo de envío</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (method === 'tienda' || precioEnvio === 0) && method !== 'standard' ? 'var(--success)' : 'var(--foreground)' }}>
                {method === 'tienda' ? '¡Gratis!' : (precioEnvio === 0 && method === 'standard' ? '$0.00' : `$${precioEnvio.toLocaleString('es-AR')}`)}
              </div>
            </div>
          </div>
          <button className="btn" style={{ padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleContinue}>
            Continuar al Pago <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Volver al carrito</button>
        </div>
      </div>
    </div>
  );
}

function ShipOption({ title, desc, icon, selected, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
        border: selected ? '2px solid var(--accent)' : '2px solid transparent',
        backgroundColor: selected ? 'oklch(0.627 0.194 259.215 / 5%)' : 'var(--card)'
      }}
    >
      <div style={{ marginBottom: '15px', color: selected ? 'var(--accent)' : 'var(--foreground)' }}>{icon}</div>
      <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>{title}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{desc}</p>
    </div>
  );
}
