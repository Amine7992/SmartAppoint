import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const appointmentId = params.get('appointment_id');
    if (appointmentId) {
      api.post(`/appointments/${appointmentId}/confirm-payment`)
        .then(() => setTimeout(() => navigate('/client/appointments'), 2000))
        .catch(console.error);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h2 style={{ color: '#042C53' }}>Paiement effectué avec succès !</h2>
      <p>Vous allez être redirigé vers vos rendez-vous…</p>
    </div>
  );
};

export default PaymentSuccess;