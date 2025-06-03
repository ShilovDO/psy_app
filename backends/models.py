from typing import List

from sqlalchemy import BigInteger, Boolean, ForeignKeyConstraint, Identity, Integer, PrimaryKeyConstraint, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class Services(Base):
    __tablename__ = 'services'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='services_pkey'),
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=2147483647, cycle=False, cache=1), primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    available: Mapped[bool] = mapped_column(Boolean)
    admin: Mapped[bool] = mapped_column(Boolean)
    instruction: Mapped[str] = mapped_column(Text)
    stations: Mapped[List['Stations']] = relationship('Stations', back_populates='services')


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='users_pkey'),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True)
    username: Mapped[str] = mapped_column(Text)
    mail: Mapped[str] = mapped_column(Text)
    password: Mapped[str] = mapped_column(Text)
    admin: Mapped[bool] = mapped_column(Boolean)

    routes: Mapped[List['Routes']] = relationship('Routes', back_populates='users')


class Routes(Base):
    __tablename__ = 'routes'
    __table_args__ = (
        ForeignKeyConstraint(['owner'], ['users.id'], name='fk_owner'),
        PrimaryKeyConstraint('id', name='routes_pkey')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True)
    owner: Mapped[int] = mapped_column(BigInteger)
    name: Mapped[str] = mapped_column(Text)

    users: Mapped['Users'] = relationship('Users', back_populates='routes')
    stations: Mapped[List['Stations']] = relationship('Stations', back_populates='routes')


class Stations(Base):
    __tablename__ = 'stations'
    __table_args__ = (
        ForeignKeyConstraint(['route'], ['routes.id'], name='fk_stations_route'),
        ForeignKeyConstraint(['service'], ['services.id'], name='fk_stations_service'),
        PrimaryKeyConstraint('route', 'number', name='stations_pkey')
    )

    route: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    number: Mapped[int] = mapped_column(Integer, primary_key=True)
    next: Mapped[int] = mapped_column(Integer)
    entry: Mapped[bool] = mapped_column(Boolean)
    service: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text)

    routes: Mapped['Routes'] = relationship('Routes', back_populates='stations')
    services: Mapped['Services'] = relationship('Services', back_populates='stations')
