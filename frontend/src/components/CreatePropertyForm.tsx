import type { FormEvent } from 'react';
import { useState } from 'react';

import type { PropertyCreatePayload } from '../types';

type Props = {
  onSubmit: (payload: PropertyCreatePayload) => void;
};

export function CreatePropertyForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      title,
      property_type: propertyType,
      city,
      area_m2: area,
    });
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Создать объект</h2>
      <label>
        Название
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label>
        Тип объекта
        <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
          <option value="apartment">Квартира</option>
          <option value="house">Дом</option>
          <option value="office">Офис</option>
          <option value="commercial">Коммерция</option>
          <option value="land">Участок</option>
          <option value="other">Другое</option>
        </select>
      </label>
      <label>
        Город
        <input value={city} onChange={(event) => setCity(event.target.value)} />
      </label>
      <label>
        Площадь
        <input value={area} onChange={(event) => setArea(event.target.value)} inputMode="decimal" />
      </label>
      <button type="submit">Создать</button>
    </form>
  );
}
