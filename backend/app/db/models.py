from typing import List
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, ForeignKeyConstraint, Identity, Integer, PrimaryKeyConstraint, Text, DateTime
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

    configs: Mapped[List['Configs']] = relationship("Configs", back_populates="services")

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

    routes: Mapped[List['Routes']] = relationship('Routes', back_populates='users', secondary='users_routes')
    configs: Mapped[List['Configs']] = relationship('Configs', back_populates='users')
    users_routes: Mapped[List['UsersRoutes']] = relationship('UsersRoutes', back_populates='user')

class Routes(Base):
    __tablename__ = 'routes'
    __table_args__ = (
        ForeignKeyConstraint(['owner'], ['users.id'], name='fk_owner'),
        PrimaryKeyConstraint('id', name='routes_pkey')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True)
    owner: Mapped[int] = mapped_column(BigInteger)
    name: Mapped[str] = mapped_column(Text)
    visible: Mapped[bool] = mapped_column(Boolean)

    users: Mapped['Users'] = relationship('Users', back_populates='routes')
    stations: Mapped[List['Stations']] = relationship('Stations', back_populates='routes')
    users_routes: Mapped[List['UsersRoutes']] = relationship('UsersRoutes', back_populates='route')

class UsersRoutes(Base):
    __tablename__ = 'users_routes'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], name='users_routes_users_id_fk'),
        ForeignKeyConstraint(['route_id'], ['routes.id'], name='users_routes_routes_id_fk'),
        PrimaryKeyConstraint('user_id', 'route_id', name='users_routes_pk'),
    )

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    route_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    visible: Mapped[bool] = mapped_column(Boolean, nullable=False)

    user: Mapped['Users'] = relationship('Users', back_populates='users_routes')
    route: Mapped['Routes'] = relationship('Routes', back_populates='users_routes')

class Stations(Base):
    __tablename__ = 'stations'
    __table_args__ = (
        ForeignKeyConstraint(['route'], ['routes.id'], name='fk_stations_route'),
        ForeignKeyConstraint(['config'], ['configs.id'], name='fk_stations_config'),
        PrimaryKeyConstraint('id', name='stations_pkey')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True)
    route: Mapped[int] = mapped_column(BigInteger)
    number: Mapped[int] = mapped_column(Integer)
    next: Mapped[int] = mapped_column(Integer)
    entry: Mapped[bool] = mapped_column(Boolean)
    config: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text)

    routes: Mapped['Routes'] = relationship('Routes', back_populates='stations')
    configs: Mapped['Configs'] = relationship('Configs', back_populates='stations')

class Configs(Base):
    __tablename__ = 'configs'
    __table_args__ = (
        ForeignKeyConstraint(['service'], ['services.id'], name='configs_services_serviceid_fk'),
        ForeignKeyConstraint(['owner'], ['users.id'], name='configs_services_userid_fk'),
        PrimaryKeyConstraint('id', name='configs_pk')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    owner: Mapped[int] = mapped_column(BigInteger)
    service: Mapped[int] = mapped_column(BigInteger)

    users: Mapped['Users'] = relationship('Users', back_populates='configs')
    stations: Mapped[List['Stations']] = relationship("Stations", back_populates="configs")
    services: Mapped['Services'] = relationship('Services', back_populates='configs')

class Results(Base):
    __tablename__ = 'results'
    __table_args__ = (
        ForeignKeyConstraint(['user'], ['users.id'], name='results_user_fk'),
        ForeignKeyConstraint(['station'], ['stations.id'], name='results_station_fk'),
        ForeignKeyConstraint(['config'], ['configs.id'], name='results_config_fk'),
        ForeignKeyConstraint(['route'], ['routes.id'], name='results_route_fk'),
        PrimaryKeyConstraint('id', name='results_pkey'),
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True)
    user: Mapped[int] = mapped_column(BigInteger)
    station: Mapped[int] = mapped_column(BigInteger)
    config: Mapped[int] = mapped_column(BigInteger)
    route: Mapped[int] = mapped_column(BigInteger)
    date_time: Mapped[datetime] = mapped_column(DateTime)

    user_rel: Mapped['Users'] = relationship('Users')
    station_rel: Mapped['Stations'] = relationship('Stations')
    config_rel: Mapped['Configs'] = relationship('Configs')
    route_rel: Mapped['Routes'] = relationship('Routes')