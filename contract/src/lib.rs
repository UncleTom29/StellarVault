#![no_std]
use soroban_sdk::{contract,contractimpl,contracttype,symbol_short,Address,Env,token};
#[contracttype]#[derive(Clone)]
pub struct Vault{pub balance:i128,pub deposited:i128,pub withdrawn:i128,pub count:u32}
#[contracttype]pub enum Key{Vault(Address),Init,TokenId}
#[contract]pub struct VaultContract;
#[contractimpl]
impl VaultContract{
  pub fn init(env:Env,admin:Address,xlm_token:Address){
    admin.require_auth();
    if env.storage().instance().has(&Key::Init){panic!("exists")}
    env.storage().instance().set(&Key::Init,&true);
    env.storage().instance().set(&Key::TokenId,&xlm_token);
    env.storage().instance().extend_ttl(200_000,200_000);
    env.events().publish((symbol_short!("INIT"),),(admin,));
  }
  pub fn deposit(env:Env,user:Address,amount:i128){
    user.require_auth();
    if amount<=0{panic!("invalid amount")}
    if !env.storage().instance().has(&Key::Init){panic!("not init")}
    // Inter-contract call: transfer XLM from user to this contract via the token contract
    let token_id:Address=env.storage().instance().get(&Key::TokenId).expect("no token");
    let token_client=token::Client::new(&env,&token_id);
    token_client.transfer(&user,&env.current_contract_address(),&amount);
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
    // Inter-contract call: transfer XLM back to user from this contract via the token contract
    let token_id:Address=env.storage().instance().get(&Key::TokenId).expect("no token");
    let token_client=token::Client::new(&env,&token_id);
    token_client.transfer(&env.current_contract_address(),&user,&amount);
    env.events().publish((symbol_short!("WITHDRAW"),),(user,amount));
  }
  pub fn get_vault(env:Env,user:Address)->Vault{
    env.storage().persistent().get(&Key::Vault(user))
      .unwrap_or(Vault{balance:0,deposited:0,withdrawn:0,count:0})
  }
  /// Inter-contract call: get on-chain XLM balance of any address via the token contract
  pub fn get_token_balance(env:Env,user:Address)->i128{
    let token_id:Address=env.storage().instance().get(&Key::TokenId).expect("no token");
    let token_client=token::Client::new(&env,&token_id);
    token_client.balance(&user)
  }
  pub fn get_token_id(env:Env)->Address{
    env.storage().instance().get(&Key::TokenId).expect("no token")
  }
}
#[cfg(test)]
mod tests{
  use super::*;use soroban_sdk::testutils::Address as _;use soroban_sdk::{Address,Env,token::StellarAssetClient};
  fn setup()->(Env,VaultContractClient<'static>,Address,Address){
    let env=Env::default();env.mock_all_auths();
    let xlm_admin=Address::generate(&env);
    let xlm=env.register_stellar_asset_contract_v2(xlm_admin.clone());
    let xlm_addr=xlm.address();
    let id=env.register_contract(None,VaultContract);
    let c=VaultContractClient::new(&env,&id);
    let admin=Address::generate(&env);
    c.init(&admin,&xlm_addr);
    // Mint XLM to admin for testing
    let sac=StellarAssetClient::new(&env,&xlm_addr);
    sac.mint(&admin,&1_000_000);
    (env,c,admin,xlm_addr)
  }
  #[test]fn test_deposit(){
    let(_env,c,user,_)=setup();
    c.deposit(&user,&1000);
    assert_eq!(c.get_vault(&user).balance,1000);
  }
  #[test]fn test_withdraw(){
    let(_env,c,user,_)=setup();
    c.deposit(&user,&5000);
    c.withdraw(&user,&2000);
    assert_eq!(c.get_vault(&user).balance,3000);
  }
  #[test]#[should_panic(expected="insufficient")]fn test_overdraw(){
    let(_env,c,user,_)=setup();
    c.deposit(&user,&100);
    c.withdraw(&user,&999);
  }
  #[test]fn test_stats(){
    let(_env,c,user,_)=setup();
    c.deposit(&user,&1000);
    c.deposit(&user,&500);
    let v=c.get_vault(&user);
    assert_eq!(v.deposited,1500);
    assert_eq!(v.count,2);
  }
  #[test]fn test_inter_contract_balance(){
    let(_env,c,user,_)=setup();
    // get_token_balance is an inter-contract call to the XLM token
    let bal=c.get_token_balance(&user);
    assert!(bal>=0);
  }
  #[test]fn test_get_token_id(){
    let(_env,c,_,xlm_addr)=setup();
    assert_eq!(c.get_token_id(),xlm_addr);
  }
}
