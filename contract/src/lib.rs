#![no_std]
use soroban_sdk::{contract,contractimpl,contracttype,symbol_short,Address,Env};
#[contracttype]#[derive(Clone)]
pub struct Vault{pub balance:i128,pub deposited:i128,pub withdrawn:i128,pub count:u32}
#[contracttype]pub enum Key{Vault(Address),Init}
#[contract]pub struct VaultContract;
#[contractimpl]
impl VaultContract{
  pub fn init(env:Env,admin:Address){
    admin.require_auth();
    if env.storage().instance().has(&Key::Init){panic!("exists")}
    env.storage().instance().set(&Key::Init,&true);
    env.storage().instance().extend_ttl(200_000,200_000);
    env.events().publish((symbol_short!("INIT"),),(admin,));
  }
  pub fn deposit(env:Env,user:Address,amount:i128){
    user.require_auth();
    if amount<=0{panic!("invalid amount")}
    if !env.storage().instance().has(&Key::Init){panic!("not init")}
    let mut v=env.storage().persistent().get::<Key,Vault>(&Key::Vault(user.clone()))
      .unwrap_or(Vault{balance:0,deposited:0,withdrawn:0,count:0});
    v.balance+=amount;v.deposited+=amount;v.count+=1;
    env.storage().persistent().set(&Key::Vault(user.clone()),&v);
    env.storage().persistent().extend_ttl(&Key::Vault(user.clone()),200_000,200_000);
    env.events().publish((symbol_short!("DEPOSIT"),),(user,amount));
  }
  pub fn withdraw(env:Env,user:Address,amount:i128){
    user.require_auth();
    if amount<=0{panic!("invalid amount")}
    let mut v=env.storage().persistent().get::<Key,Vault>(&Key::Vault(user.clone())).expect("no vault");
    if v.balance<amount{panic!("insufficient")}
    v.balance-=amount;v.withdrawn+=amount;
    env.storage().persistent().set(&Key::Vault(user.clone()),&v);
    env.storage().persistent().extend_ttl(&Key::Vault(user.clone()),200_000,200_000);
    env.events().publish((symbol_short!("WITHDRAW"),),(user,amount));
  }
  pub fn get_vault(env:Env,user:Address)->Vault{
    env.storage().persistent().get(&Key::Vault(user))
      .unwrap_or(Vault{balance:0,deposited:0,withdrawn:0,count:0})
  }
}
#[cfg(test)]
mod tests{
  use super::*;use soroban_sdk::testutils::Address as _;use soroban_sdk::{Address,Env};
  fn setup()->(Env,VaultContractClient<'static>,Address){
    let env=Env::default();env.mock_all_auths();
    let id=env.register_contract(None,VaultContract);
    let c=VaultContractClient::new(&env,&id);
    let admin=Address::generate(&env);
    c.init(&admin);(env,c,admin)
  }
  #[test]fn test_deposit(){let(env,c,_)=setup();let u=Address::generate(&env);c.deposit(&u,&1000);assert_eq!(c.get_vault(&u).balance,1000);}
  #[test]fn test_withdraw(){let(env,c,_)=setup();let u=Address::generate(&env);c.deposit(&u,&5000);c.withdraw(&u,&2000);assert_eq!(c.get_vault(&u).balance,3000);}
  #[test]#[should_panic(expected="insufficient")]fn test_overdraw(){let(env,c,_)=setup();let u=Address::generate(&env);c.deposit(&u,&100);c.withdraw(&u,&999);}
  #[test]fn test_stats(){let(env,c,_)=setup();let u=Address::generate(&env);c.deposit(&u,&1000);c.deposit(&u,&500);let v=c.get_vault(&u);assert_eq!(v.deposited,1500);assert_eq!(v.count,2);}
}
